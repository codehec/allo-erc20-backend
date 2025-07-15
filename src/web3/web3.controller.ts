import { Controller, Get, Post, Body, Query, Param, BadRequestException } from '@nestjs/common';
import { Web3Service, PendingEvent } from './web3.service';

@Controller('web3')
export class Web3Controller {
  constructor(private readonly web3Service: Web3Service) {}

  @Get('status')
  getStatus() {
    return { connected: this.web3Service.isWeb3Connected() };
  }

  @Get('events/recent/:contractAddress')
  async getRecentEvents(
    @Param('contractAddress') contractAddress?: string,
    @Query() query: any = {}
  ) {
    try {
      const fromBlock = query.fromBlock ? parseInt(query.fromBlock) : undefined;
      const toBlock = query.toBlock ? parseInt(query.toBlock) : undefined;
      const limit = query.limit ? parseInt(query.limit) : 100;
      const queryContractAddress = query.contractAddress;
      
      const targetContractAddress = contractAddress || queryContractAddress;
      
      const events = await this.web3Service.getRecentEvents(
        targetContractAddress,
        fromBlock,
        toBlock,
        limit
      );

      return {
        success: true,
        data: {
          events,
          count: events.length,
          contractAddress: targetContractAddress,
          fromBlock,
          toBlock,
          limit
        }
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        error: error.message
      });
    }
  }

  @Get('token/balance/:contractAddress/:address')
  async getTokenBalance(
    @Param('contractAddress') contractAddress: string,
    @Param('address') address: string
  ) {
    try {
      const balance = await this.web3Service.getTokenBalance(contractAddress, address);

      return {
        success: true,
        data: balance
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        error: error.message
      });
    }
  }
} 