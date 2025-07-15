import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import Web3 from 'web3';
import { blockchainConfig } from '../config/blockchain.config';
import { contractsConfig } from '../config/contracts.config';
import { BlockchainEventsGateway, BlockchainEvent } from '../websocket/websocket.gateway';

export interface PendingEvent {
  txHash: string;
  log: any;
  contract: any;
  topics: any;
  timestamp: number;
  retryCount: number;
  lastCheckTime: number;
  checkInterval?: NodeJS.Timeout;
}

@Injectable()
export class Web3Service {
  private web3: Web3;
  private isConnected = false;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout;
  private readonly logger = new Logger(Web3Service.name);
  
  private readonly batchSize = blockchainConfig.batchSize;

  constructor(
    @Inject(forwardRef(() => BlockchainEventsGateway))
    private readonly blockchainEventsGateway: BlockchainEventsGateway,
  ) {}

  private serializeBigIntValues(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (typeof obj === 'bigint') {
      return obj.toString();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.serializeBigIntValues(item));
    }
    
    if (typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.serializeBigIntValues(value);
      }
      return result;
    }
    
    return obj;
  }
  private readonly batchInterval = blockchainConfig.batchInterval;
  private batchTimer: NodeJS.Timeout | undefined;
  
  private pendingEvents: PendingEvent[] = [];
  private isProcessingBatch = false;

  async connect(): Promise<Web3> {
    if (this.isConnected && this.web3) {
      return this.web3;
    }

    for (let attempt = 1; attempt <= blockchainConfig.retryAttempts; attempt++) {
      try {
        this.web3 = new Web3(blockchainConfig.wssUrl);
        
        if (!this.web3.provider) {
          throw new Error('Web3 provider not initialized');
        }

        this.web3.provider.on('connect', () => {
          this.logger.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.subscribeToContractEvents();
          this.startBatchProcessing();
        });

        this.web3.provider.on('error', (error) => {
          this.logger.error(`WebSocket error: ${error.message}`);
          this.isConnected = false;
          this.stopBatchProcessing();
          this.scheduleReconnect();
        });

        this.web3.provider.on('end', () => {
          this.logger.warn('WebSocket connection ended');
          this.isConnected = false;
          this.stopBatchProcessing();
          this.scheduleReconnect();
        });

        this.web3.provider.on('close', () => {
          this.logger.warn('WebSocket connection closed');
          this.isConnected = false;
          this.stopBatchProcessing();
          this.scheduleReconnect();
        });

        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Connection timeout'));
          }, blockchainConfig.connectionTimeout);

          this.web3.provider!.once('connect', () => {
            clearTimeout(timeout);
            resolve(true);
          });

          this.web3.provider!.once('error', (error) => {
            clearTimeout(timeout);
            reject(error);
          });
        });

        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.logger.log('Connected to blockchain via WSS');
        this.startBatchProcessing();
        return this.web3;

      } catch (error) {
        this.logger.error(`Connection attempt ${attempt} failed: ${error.message}`);
        
        if (attempt < blockchainConfig.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, blockchainConfig.retryDelay));
        } else {
          throw new Error(`Failed to connect after ${blockchainConfig.retryAttempts} attempts`);
        }
      }
    }
    
    throw new Error('Connection failed after all attempts');
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(async () => {
      if (!this.isConnected) {
        try {
          await this.connect();
        } catch (error) {
          this.logger.error(`Reconnection failed: ${error.message}`);
        }
      }
    }, blockchainConfig.retryDelay);
  }

  getWeb3(): Web3 {
    if (!this.web3 || !this.isConnected) {
      throw new Error('Web3 not connected');
    }
    return this.web3;
  }

  isWeb3Connected(): boolean {
    return this.isConnected;
  }

  getPendingEventsCount(): number {
    return this.pendingEvents.length;
  }

  getPendingEvents(): PendingEvent[] {
    return [...this.pendingEvents]; 
  }


  private decodeIndexedParameter(topic: string): any {

    try {
      const address = this.web3.utils.toChecksumAddress(topic);
      return {
        type: 'address',
        value: address
      };
    } catch {
      try {
        const number = this.web3.utils.hexToNumberString(topic);
        return {
          type: 'uint256',
          value: number
        };
      } catch {
        return {
          type: 'unknown',
          value: topic
        };
      }
    }
  }

  private startBatchProcessing(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
    
    this.batchTimer = setInterval(() => {
      this.processBatch();
    }, this.batchInterval);
  }

  private stopBatchProcessing(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = undefined;
      this.logger.log('Stopped batch processing');
    }
  }


  private async processBatch(): Promise<void> {
    if (this.isProcessingBatch || this.pendingEvents.length === 0) {
      return;
    }

    this.isProcessingBatch = true;
    
    try {
      const batch = this.pendingEvents.slice(0, this.batchSize);
      this.logger.log(`Processing batch of ${batch.length} pending events`);
      
      const promises = batch.map(async (pendingEvent) => {
        try {
          const currentBlock = await this.web3.eth.getBlockNumber();
          const txBlock = Number(pendingEvent.log.blockNumber);
          const confirmations = Number(currentBlock) - txBlock;
          
          pendingEvent.retryCount++;
          pendingEvent.lastCheckTime = Date.now();
          
          this.logger.log(`Checking confirmations for ${pendingEvent.txHash}: ${confirmations}`);
          
          if (confirmations >= blockchainConfig.confirmationsRequired) {
            this.logger.log(`Processing ${pendingEvent.txHash} with ${confirmations} confirmations`);
            this.processConfirmedEvent(pendingEvent.log, pendingEvent.contract, pendingEvent.topics, confirmations);
            return pendingEvent.txHash; 
          } else if (pendingEvent.retryCount > blockchainConfig.maxRetries) {
            this.logger.warn(`Stopping retry for ${pendingEvent.txHash} after ${pendingEvent.retryCount} attempts`);
            return pendingEvent.txHash; 
          }
          
          return null; 
        } catch (error) {
          this.logger.error(`Error processing batch: ${error.message}`);
          pendingEvent.retryCount++;
          pendingEvent.lastCheckTime = Date.now();
          return null; 
        }
      });
      
      const results = await Promise.all(promises);
      
      const hashesToRemove = results.filter(hash => hash !== null);
      if (hashesToRemove.length > 0) {
        this.pendingEvents = this.pendingEvents.filter(event => !hashesToRemove.includes(event.txHash));
      }
      
    } catch (error) {
      this.logger.error(`Error processing batch: ${error.message}`);
    } finally {
      this.isProcessingBatch = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.web3 && this.web3.provider) {
      this.web3.provider.disconnect();
      this.isConnected = false;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.stopBatchProcessing();
    
    this.pendingEvents = [];
  }


  async subscribeToContractEvents(): Promise<void> {
    if (!this.web3 || !this.isConnected) {
      this.logger.error('Web3 not connected.');
      return;
    }
    
    const contractAddresses = contractsConfig.contracts.map(contract => contract.address);
    
    const contractMap = new Map<string, any>();
    for (const contract of contractsConfig.contracts) {
      contractMap.set(contract.address.toLowerCase(), contract);
    }
    
    const transferTopic = this.web3.utils.sha3('Transfer(address,address,uint256)') || '';
    const mintedTopic = this.web3.utils.sha3('Minted(address,uint256)') || '';
    const burnedTopic = this.web3.utils.sha3('Burned(address,uint256)') || '';
    const topics = { transferTopic, mintedTopic, burnedTopic };
    
    try {
      const subscription = await this.web3.eth.subscribe('logs', {
        address: contractAddresses
      });
      
      subscription.on('data', async (log) => {
        const contractAddress = log.address?.toLowerCase();
        const contract = contractMap.get(contractAddress);
        
        if (!contract) {
          this.logger.warn(`Received event for unknown contract: ${contractAddress}`);
          return;
        }
        
        const currentBlock = await this.web3.eth.getBlockNumber();
        const txBlock = Number(log.blockNumber);
        const confirmations = Number(currentBlock) - txBlock;
        
        if (confirmations >= blockchainConfig.confirmationsRequired) {
          this.processConfirmedEvent(log, contract, topics, confirmations);
        } else {
          const txHash = log.transactionHash || '';
          const pendingEvent: PendingEvent = {
            txHash,
            log,
            contract,
            topics,
            timestamp: Date.now(),
            retryCount: 0,
            lastCheckTime: Date.now()
          };
          
          this.pendingEvents.push(pendingEvent);
        }
      });
      
      subscription.on('error', (error) => {
        this.logger.error(`Error: ${error.message}`);
      });
      
      subscription.on('connected', () => {
        this.logger.log(`Subscription connected`);
      });
      
    } catch (error) {
      this.logger.error(`Failed to create subscription: ${error.message}`);
    }
  }

  private processConfirmedEvent(log: any, contract: any, topics: any, confirmations: number): void {
    const txHash = log.transactionHash || '';
    const contractAddress = log.address?.toLowerCase();
    const blockNumber = log.blockNumber;
    const timestamp = new Date().toISOString();

    if (log.topics[0] === topics.transferTopic) {

        const decodedLog = this.web3.eth.abi.decodeLog(
          [
            { type: 'address', name: 'from', indexed: true },
            { type: 'address', name: 'to', indexed: true }, 
            { type: 'uint256', name: 'value', indexed: false }
          ],
          log.data,
          [log.topics[1], log.topics[2]]
        );
        const fromAddress = decodedLog.from as string;
        const toAddress = decodedLog.to as string;
        const value = decodedLog.value as bigint;
      
      const eventData = {
        contractAddress,
        eventType: 'Transfer',
        txHash,
        blockNumber: blockNumber.toString(),
        timestamp,
        confirmations,
        from: fromAddress,
        to: toAddress,
        value: value.toString()
      };
      
      this.logger.log(`Transfer event:`, eventData);
      
      this.emitBlockchainEvent('Transfer', contractAddress, {
        txHash,
        blockNumber: blockNumber.toString(),
        timestamp,
        confirmations,
        from: fromAddress,
        to: toAddress,
        value: value.toString()
      });
      
    } else if (log.topics[0] === topics.mintedTopic) {
      
      
      const decodedLog = this.web3.eth.abi.decodeLog(
        [
          { type: 'address', name: 'to', indexed: true },
          { type: 'uint256', name: 'amount', indexed: true }
        ],
        log.data,
        [log.topics[1], log.topics[2]]
      );
        const toAddress = decodedLog.to as string;
        const amount = decodedLog.amount as bigint;
      
      const eventData = {
        contractAddress,
        eventType: 'Minted',
        txHash,
        blockNumber: blockNumber.toString(),
        timestamp,
        confirmations,
        to: toAddress,
        amount: amount.toString()
      };
      
      this.logger.log(`Minted event:`, eventData);
      
      this.emitBlockchainEvent('Minted', contractAddress, {
        txHash,
        blockNumber: blockNumber.toString(),
        timestamp,
        confirmations,
        to: toAddress,
        amount: amount.toString()
      });
      
    } else if (log.topics[0] === topics.burnedTopic) {
      
      
      const decodedLog = this.web3.eth.abi.decodeLog(
        [
          { type: 'address', name: 'from', indexed: true },
          { type: 'uint256', name: 'amount', indexed: true }
        ],
        log.data,
        [log.topics[1], log.topics[2]]
      );
      const fromAddress = decodedLog.from as string;
      const amount = decodedLog.amount as bigint;
      
      const eventData = {
        contractAddress,
        eventType: 'Burned',
        txHash,
        blockNumber: blockNumber.toString(),
        timestamp,
        confirmations,
        from: fromAddress,
        amount: amount.toString()
      };
      
      this.logger.log(`Burned event:`, eventData);
      
      this.emitBlockchainEvent('Burned', contractAddress, {
        txHash,
        blockNumber: blockNumber.toString(),
        timestamp,
        confirmations,
        from: fromAddress,
        amount: amount.toString()
      });
      
    } else {
      this.logger.warn(`Unknown event topic: ${log.topics[0]} for contract ${contractAddress}`);
      this.logger.log(`Raw event data:`, {
        txHash,
        contractAddress,
        topics: log.topics,
        data: log.data,
        blockNumber,
        confirmations
      });
    }
  }

  async getRecentEvents(contractAddress?: string, fromBlock?: number, toBlock?: number, limit: number = 100): Promise<any[]> {
    if (!this.web3 || !this.isConnected) {
      throw new Error('Web3 not connected');
    }

    try {
      const currentBlock = await this.web3.eth.getBlockNumber();
      const currentBlockNumber = Number(currentBlock);
      
      if (!fromBlock) {
        fromBlock = Math.max(1, currentBlockNumber - 1000);
      }
      if (!toBlock) {
        toBlock = currentBlockNumber;
      }

      if (fromBlock > toBlock) {
        throw new Error('fromBlock cannot be greater than toBlock');
      }
      if (toBlock - fromBlock > 10000) {
        throw new Error('Block range cannot exceed 10000 blocks');
      }

      let contractsToQuery = contractsConfig.contracts;
      if (contractAddress) {
        const normalizedAddress = this.web3.utils.toChecksumAddress(contractAddress);
        contractsToQuery = contractsConfig.contracts.filter(
          contract => this.web3.utils.toChecksumAddress(contract.address) === normalizedAddress
        );
        
        if (contractsToQuery.length === 0) {
          throw new Error(`Contract address ${contractAddress} not found in configuration`);
        }
      }

      const transferTopic = this.web3.utils.sha3('Transfer(address,address,uint256)') || '';
      const mintedTopic = this.web3.utils.sha3('Minted(address,uint256)') || '';
      const burnedTopic = this.web3.utils.sha3('Burned(address,uint256)') || '';

      const allEvents: any[] = [];

      for (const contract of contractsToQuery) {
        try {
          const transferLogs = await this.web3.eth.getPastLogs({
            address: contract.address,
            topics: [transferTopic],
            fromBlock: this.web3.utils.toHex(fromBlock),
            toBlock: this.web3.utils.toHex(toBlock)
          });

          const mintedLogs = await this.web3.eth.getPastLogs({
            address: contract.address,
            topics: [mintedTopic],
            fromBlock: this.web3.utils.toHex(fromBlock),
            toBlock: this.web3.utils.toHex(toBlock)
          });

          const burnedLogs = await this.web3.eth.getPastLogs({
            address: contract.address,
            topics: [burnedTopic],
            fromBlock: this.web3.utils.toHex(fromBlock),
            toBlock: this.web3.utils.toHex(toBlock)
          });

          const processLogs = (logs: any[], eventType: string) => {
            return logs.map(log => {
              const timestamp = new Date().toISOString();
              const confirmations = currentBlockNumber - Number(log.blockNumber);
              
              let eventData: any = {
                contractAddress: contract.address,
                contractName: contract.name,
                eventType,
                txHash: log.transactionHash,
                blockNumber: log.blockNumber,
                timestamp,
                confirmations,
                logIndex: log.logIndex.toString()
              };

              if (eventType === 'Transfer') {
                const decodedLog = this.web3.eth.abi.decodeLog(
                  [
                    { type: 'address', name: 'from', indexed: true },
                    { type: 'address', name: 'to', indexed: true },
                    { type: 'uint256', name: 'value', indexed: false }
                  ],
                  log.data,
                  [log.topics[1], log.topics[2]]
                );
                eventData = {
                  ...eventData,
                  from: decodedLog.from,
                  to: decodedLog.to,
                  value: (decodedLog.value as bigint).toString()
                };
              } else if (eventType === 'Minted') {
                const decodedLog = this.web3.eth.abi.decodeLog(
                  [
                    { type: 'address', name: 'to', indexed: true },
                    { type: 'uint256', name: 'amount', indexed: true }
                  ],
                  log.data,
                  [log.topics[1], log.topics[2]]
                );
                eventData = {
                  ...eventData,
                  to: decodedLog.to,
                  amount: (decodedLog.amount as bigint).toString()
                };
              } else if (eventType === 'Burned') {
                const decodedLog = this.web3.eth.abi.decodeLog(
                  [
                    { type: 'address', name: 'from', indexed: true },
                    { type: 'uint256', name: 'amount', indexed: true }
                  ],
                  log.data,
                  [log.topics[1], log.topics[2]]
                );
                eventData = {
                  ...eventData,
                  from: decodedLog.from,
                  amount: (decodedLog.amount as bigint).toString()
                };
              }

              return eventData;
            });
          };

          allEvents.push(
            ...processLogs(transferLogs, 'Transfer'),
            ...processLogs(mintedLogs, 'Minted'),
            ...processLogs(burnedLogs, 'Burned')
          );

        } catch (error) {
          this.logger.error(`Error getting events for contract ${contract.address}: ${error.message}`);
        }
      }

      allEvents.sort((a, b) => {
        if (a.blockNumber !== b.blockNumber) {
          return Number(b.blockNumber) - Number(a.blockNumber);
        }
        return Number(b.logIndex) - Number(a.logIndex);
      });

      return this.serializeBigIntValues(allEvents.slice(0, limit));

    } catch (error) {
      this.logger.error(`Error getting recent events: ${error.message}`);
      throw error;
    }
  }

  async getTokenBalance(contractAddress: string, userAddress: string): Promise<any> {
    if (!this.web3 || !this.isConnected) {
      throw new Error('Web3 not connected');
    }

    try {
      const normalizedContractAddress = this.web3.utils.toChecksumAddress(contractAddress);
      const normalizedUserAddress = this.web3.utils.toChecksumAddress(userAddress);

      const contractInstance = new this.web3.eth.Contract(contractsConfig.abi, normalizedContractAddress);

      const balance = await contractInstance.methods.balanceOf(normalizedUserAddress).call() as string;

      const name = await contractInstance.methods.name().call().catch(() => 'Unknown') as string;
      const symbol = await contractInstance.methods.symbol().call().catch(() => 'Unknown') as string;
      const decimals = await contractInstance.methods.decimals().call().catch(() => '18') as string;

      return {
        contractAddress: normalizedContractAddress,
        contractName: name,
        userAddress: normalizedUserAddress,
        balance: balance.toString(),
        name,
        symbol,
        decimals: Number(decimals),
        formattedBalance: this.web3.utils.fromWei(balance, 'ether')
      };

    } catch (error) {
      this.logger.error(`Error getting token balance: ${error.message}`);
      throw error;
    }
  }

  private emitBlockchainEvent(
    eventType: 'Transfer' | 'Minted' | 'Burned',
    contractAddress: string,
    data: {
      txHash: string;
      blockNumber: string;
      timestamp: string;
      confirmations: number;
      from?: string;
      to?: string;
      value?: string;
      amount?: string;
    }
  ): void {
    try {
      const blockchainEvent: BlockchainEvent = {
        contractAddress,
        event: eventType,
        data
      };

      this.blockchainEventsGateway.broadcastEvent(blockchainEvent);
      this.logger.debug(`WebSocket event emitted: ${eventType} on ${contractAddress}`);
    } catch (error) {
      this.logger.error(`Error emitting WebSocket event: ${error.message}`);
    }
  }
} 