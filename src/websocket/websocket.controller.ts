import { Controller, Get } from '@nestjs/common';
import { BlockchainEventsGateway } from './websocket.gateway';

@Controller('websocket')
export class WebsocketController {
  constructor(private readonly blockchainEventsGateway: BlockchainEventsGateway) {}

  @Get('status')
  getStatus() {
    return {
      connected: true,
      connectedClients: this.blockchainEventsGateway.getConnectedClientsCount(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('subscriptions')
  getSubscriptions() {
    return {
      subscriptions: this.blockchainEventsGateway.getAllSubscriptions(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('info')
  getInfo() {
    return {
      namespace: '/blockchain-events',
      events: ['Transfer', 'Minted', 'Burned'],
      subscriptionTypes: [
        'all',
        'all:Transfer',
        'all:Minted', 
        'all:Burned',
        '{contractAddress}:all',
        '{contractAddress}:Transfer',
        '{contractAddress}:Minted',
        '{contractAddress}:Burned'
      ],
      timestamp: new Date().toISOString(),
    };
  }
} 