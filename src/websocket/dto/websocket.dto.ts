import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEthereumAddress } from 'class-validator';

export class SubscribeDto {
  @ApiPropertyOptional({ description: 'Contract address to subscribe to' })
  @IsOptional()
  @IsEthereumAddress()
  contractAddress?: string;

  @ApiPropertyOptional({ description: 'Event type to subscribe to'})
  @IsOptional()
  @IsString()
  event?: string;
}

export class UnsubscribeDto {
  @ApiPropertyOptional({ description: 'Contract address to unsubscribe from' })
  @IsOptional()
  @IsEthereumAddress()
  contractAddress?: string;

  @ApiPropertyOptional({ description: 'Event type to unsubscribe from'})
  @IsOptional()
  @IsString()
  event?: string;
}

export class BlockchainEventDto {
  @ApiProperty({ description: 'Contract address where the event occurred' })
  contractAddress: string;

  @ApiProperty({ description: 'Type of blockchain event'})
  event: 'Transferred' | 'Minted' | 'Burned';

  @ApiProperty({ description: 'Event data' })
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

export class ConnectionResponseDto {
  @ApiProperty({ description: 'Connection message' })
  message: string;

  @ApiProperty({ description: 'Client ID' })
  clientId: string;

  @ApiProperty({ description: 'Connection timestamp' })
  timestamp: string;
}

export class SubscriptionResponseDto {
  @ApiProperty({ description: 'Subscription key' })
  subscription: string;

  @ApiProperty({ description: 'Subscription message' })
  message: string;
}

export class SubscriptionsResponseDto {
  @ApiProperty({ description: 'List of active subscriptions'})
  subscriptions: string[];
}

export class ErrorResponseDto {
  @ApiProperty({ description: 'Error message' })
  message: string;
}

export class WebsocketStatusResponseDto {
  @ApiProperty({ description: 'Connection status' })
  connected: boolean;

  @ApiProperty({ description: 'Number of connected clients' })
  connectedClients: number;

  @ApiProperty({ description: 'Response timestamp' })
  timestamp: string;
}

export class WebsocketSubscriptionsResponseDto {
  @ApiProperty({ description: 'List of all subscriptions by client' })
  subscriptions: { clientId: string; subscriptions: string[] }[];

  @ApiProperty({ description: 'Response timestamp' })
  timestamp: string;
}

export class WebsocketInfoResponseDto {
  @ApiProperty({ description: 'WebSocket namespace' })
  namespace: string;

  @ApiProperty({ description: 'Available event types' })
  events: string[];

  @ApiProperty({ description: 'Available subscription types' })
  subscriptionTypes: string[];

  @ApiProperty({ description: 'Response timestamp' })
  timestamp: string;
} 