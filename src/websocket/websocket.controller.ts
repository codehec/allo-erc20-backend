import { Controller, Get } from '@nestjs/common';
import { BlockchainEventsGateway } from './websocket.gateway';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  WebsocketStatusResponseDto,
  WebsocketSubscriptionsResponseDto,
  WebsocketInfoResponseDto
} from './dto/websocket.dto';

@ApiTags('WebSocket')
@Controller('websocket')
export class WebsocketController {
  constructor(private readonly blockchainEventsGateway: BlockchainEventsGateway) {}

  @Get('status')
  @ApiOperation({ summary: 'Get WebSocket connection status' })
  @ApiResponse({ status: 200, description: 'WebSocket status retrieved successfully', type: WebsocketStatusResponseDto })
  getStatus(): WebsocketStatusResponseDto {
    return {
      connected: true,
      connectedClients: this.blockchainEventsGateway.getConnectedClientsCount(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'Get all WebSocket subscriptions' })
  @ApiResponse({ status: 200, description: 'Subscriptions retrieved successfully', type: WebsocketSubscriptionsResponseDto })
  getSubscriptions(): WebsocketSubscriptionsResponseDto {
    return {
      subscriptions: this.blockchainEventsGateway.getAllSubscriptions(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('info')
  @ApiOperation({ summary: 'Get WebSocket information and available events' })
  @ApiResponse({ status: 200, description: 'WebSocket info retrieved successfully', type: WebsocketInfoResponseDto })
  getInfo(): WebsocketInfoResponseDto {
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