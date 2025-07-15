import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

export interface BlockchainEvent {
  contractAddress: string;
  event: 'Transfer' | 'Minted' | 'Burned';
  data: {
    txHash: string;
    blockNumber: string;
    timestamp: string;
    confirmations: number;
    from?: string;
    to?: string;
    value?: string;
    amount?: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  namespace: '/blockchain-events',
})
export class BlockchainEventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(BlockchainEventsGateway.name);
  private connectedClients = new Map<string, { socket: Socket; subscriptions: Set<string> }>();

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    const clientId = client.id;
    this.connectedClients.set(clientId, {
      socket: client,
      subscriptions: new Set(),
    });
    
    this.logger.log(`Client connected: ${clientId}`);
    
    client.emit('connected', {
      message: 'Connected to blockchain events',
      clientId,
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    const clientId = client.id;
    this.connectedClients.delete(clientId);
    this.logger.log(`Client disconnected: ${clientId}`);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, payload: { contractAddress?: string; event?: string }) {
    const clientId = client.id;
    const clientData = this.connectedClients.get(clientId);
    
    if (!clientData) {
      client.emit('error', { message: 'Client not found' });
      return;
    }

    let subscriptionKey = 'all';
    
    if (payload.contractAddress && payload.event) {
      subscriptionKey = `${payload.contractAddress.toLowerCase()}:${payload.event}`;
    } else if (payload.contractAddress) {
      subscriptionKey = `${payload.contractAddress.toLowerCase()}:all`;
    } else if (payload.event) {
      subscriptionKey = `all:${payload.event}`;
    }

    clientData.subscriptions.add(subscriptionKey);
    
    this.logger.log(`Client ${clientId} subscribed to: ${subscriptionKey}`);
    
    client.emit('subscribed', {
      subscription: subscriptionKey,
      message: `Subscribed to ${subscriptionKey}`,
    });
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, payload: { contractAddress?: string; event?: string }) {
    const clientId = client.id;
    const clientData = this.connectedClients.get(clientId);
    
    if (!clientData) {
      client.emit('error', { message: 'Client not found' });
      return;
    }

    let subscriptionKey = 'all';
    
    if (payload.contractAddress && payload.event) {
      subscriptionKey = `${payload.contractAddress.toLowerCase()}:${payload.event}`;
    } else if (payload.contractAddress) {
      subscriptionKey = `${payload.contractAddress.toLowerCase()}:all`;
    } else if (payload.event) {
      subscriptionKey = `all:${payload.event}`;
    }

    clientData.subscriptions.delete(subscriptionKey);
    
    this.logger.log(`Client ${clientId} unsubscribed from: ${subscriptionKey}`);
    
    client.emit('unsubscribed', {
      subscription: subscriptionKey,
      message: `Unsubscribed from ${subscriptionKey}`,
    });
  }

  @SubscribeMessage('getSubscriptions')
  handleGetSubscriptions(client: Socket) {
    const clientId = client.id;
    const clientData = this.connectedClients.get(clientId);
    
    if (!clientData) {
      client.emit('error', { message: 'Client not found' });
      return;
    }

    client.emit('subscriptions', {
      subscriptions: Array.from(clientData.subscriptions),
    });
  }

  broadcastEvent(event: BlockchainEvent) {
    const { contractAddress, event: eventType } = event;
    const contractAddressLower = contractAddress.toLowerCase();
    
    this.connectedClients.forEach((clientData, clientId) => {
      const { socket, subscriptions } = clientData;
      
      const shouldReceive = subscriptions.has('all') || 
                           subscriptions.has(`${contractAddressLower}:all`) ||
                           subscriptions.has(`all:${eventType}`) ||
                           subscriptions.has(`${contractAddressLower}:${eventType}`);
      
      if (shouldReceive) {
        socket.emit('blockchain-event', event);
        this.logger.debug(`Event sent to client ${clientId}: ${eventType} on ${contractAddress}`);
      }
    });
  }

  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  getAllSubscriptions(): { clientId: string; subscriptions: string[] }[] {
    const result: { clientId: string; subscriptions: string[] }[] = [];
    
    this.connectedClients.forEach((clientData, clientId) => {
      result.push({
        clientId,
        subscriptions: Array.from(clientData.subscriptions),
      });
    });
    
    return result;
  }
} 