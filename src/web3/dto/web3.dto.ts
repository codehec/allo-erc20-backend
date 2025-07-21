import { IsOptional, IsString, IsNumber, Min, Max, IsEthereumAddress } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetRecentEventsQueryDto {
  @ApiPropertyOptional({ description: 'Starting block number', minimum: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  fromBlock?: number;

  @ApiPropertyOptional({ description: 'Ending block number', minimum: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  toBlock?: number;

  @ApiPropertyOptional({ description: 'Maximum number of events to return', minimum: 1, maximum: 1000, default: 100 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number = 100;
}

export class GetRecentEventsResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response data' })
  data: {
    events: any[];
    count: number;
    contractAddress: string;
    fromBlock?: number;
    toBlock?: number;
    limit: number;
  };
}

export class GetTokenBalanceParamsDto {
  @ApiProperty({ description: 'Contract address of the token' })
  @IsEthereumAddress()
  contractAddress: string;

  @ApiProperty({ description: 'User address to check balance for' })
  @IsEthereumAddress()
  address: string;
}

export class GetTokenBalanceResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Token balance data' })
  data: any;
}

export class GetEventDataByUserAddressParamsDto {
  @ApiProperty({ description: 'User address to filter events' })
  @IsEthereumAddress()
  address: string;
}

export class GetEventDataByUserAddressQueryDto {
  @ApiPropertyOptional({ description: 'Type of event to filter' })
  @IsOptional()
  @IsString()
  eventType?: string;
}

export class GetEventDataByUserAddressResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Filtered events data' })
  data: any[];
}

export class GetReportDailyQueryDto {
  @ApiPropertyOptional({ description: 'Type of event to filter' })
  @IsOptional()
  @IsString()
  eventType?: string;
}

export class GetReportDailyParamsDto {
  @ApiProperty({ description: 'Contract address for daily report' })
  @IsEthereumAddress()
  contractAddress: string;
}

export class GetReportDailyResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Daily report data' })
  data: any;
}

export class Web3StatusResponseDto {
  @ApiProperty({ description: 'Web3 connection status' })
  connected: boolean;
} 