import { Controller, Get, Post, Body, Query, Param, BadRequestException } from '@nestjs/common';
import { Web3Service, PendingEvent } from './web3.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import {
  GetRecentEventsQueryDto,
  GetRecentEventsResponseDto,
  GetTokenBalanceParamsDto,
  GetTokenBalanceResponseDto,
  GetEventDataByUserAddressParamsDto,
  GetEventDataByUserAddressQueryDto,
  GetEventDataByUserAddressResponseDto,
  GetReportDailyQueryDto,
  GetReportDailyParamsDto,
  GetReportDailyResponseDto,
  Web3StatusResponseDto
} from './dto/web3.dto';

@ApiTags('Web3')
@Controller('web3')
export class Web3Controller {
  constructor(private readonly web3Service: Web3Service) {}

  @Get('status')
  @ApiOperation({ summary: 'Get Web3 connection status' })
  @ApiResponse({ status: 200, description: 'Web3 connection status', type: Web3StatusResponseDto })
  getStatus(): Web3StatusResponseDto {
    return { connected: this.web3Service.isWeb3Connected() };
  }

  @Get('events/recent/:contractAddress')
  @ApiOperation({ summary: 'Get recent blockchain events for a contract' })
  @ApiParam({ name: 'contractAddress', description: 'Contract address to get events for', required: false })
  @ApiQuery({ name: 'fromBlock', description: 'Starting block number', required: false, type: Number })
  @ApiQuery({ name: 'toBlock', description: 'Ending block number', required: false, type: Number })
  @ApiQuery({ name: 'limit', description: 'Maximum number of events to return', required: false, type: Number })
  @ApiQuery({ name: 'contractAddress', description: 'Contract address', required: false })
  @ApiResponse({ status: 200, description: 'Recent events retrieved successfully', type: GetRecentEventsResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async getRecentEvents(
    @Param('contractAddress') contractAddress?: string,
    @Query() query: GetRecentEventsQueryDto = {}
  ): Promise<GetRecentEventsResponseDto> {
    try {
      const currentBlock = await this.web3Service.getBlockNumber();
      const fromBlock = query.fromBlock ? parseInt(query.fromBlock.toString()) : currentBlock - 10000;
      const toBlock = query.toBlock ? parseInt(query.toBlock.toString()) : currentBlock;
      const limit = query.limit ? parseInt(query.limit.toString()) : 100;
      const queryContractAddress = query.contractAddress;
      
      const targetContractAddress = contractAddress || queryContractAddress || '';
      
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
  @ApiOperation({ summary: 'Get token balance for a specific address' })
  @ApiParam({ name: 'contractAddress', description: 'Contract address of the token' })
  @ApiParam({ name: 'address', description: 'User address to check balance for' })
  @ApiResponse({ status: 200, description: 'Token balance retrieved successfully', type: GetTokenBalanceResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async getTokenBalance(
    @Param() params: GetTokenBalanceParamsDto
  ): Promise<GetTokenBalanceResponseDto> {
    try {
      const balance = await this.web3Service.getTokenBalance(params.contractAddress, params.address);

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

  @Get('events/filter/:address')
  @ApiOperation({ summary: 'Get events filtered by user address' })
  @ApiParam({ name: 'address', description: 'User address to filter events by' })
  @ApiQuery({ name: 'eventType', description: 'Type of event to filter', required: false })
  @ApiResponse({ status: 200, description: 'Filtered events retrieved successfully', type: GetEventDataByUserAddressResponseDto })
  async getEventDataByUserAddress(
    @Param() params: GetEventDataByUserAddressParamsDto,
    @Query() query: GetEventDataByUserAddressQueryDto
  ): Promise<GetEventDataByUserAddressResponseDto> {
    const events = await this.web3Service.getEventDataByUserAddress(params.address, query.eventType);
    return { success: true, data: events };
  }

  @Get('report/daily')
  @ApiOperation({ summary: 'Get daily report for all contracts' })
  @ApiQuery({ name: 'eventType', description: 'Type of event to filter', required: false })
  @ApiResponse({ status: 200, description: 'Daily report retrieved successfully', type: GetReportDailyResponseDto })
  async getReportDailyAll(
    @Query() query: GetReportDailyQueryDto
  ): Promise<GetReportDailyResponseDto> {
    const events = await this.web3Service.getReportDaily(undefined, query.eventType);
    return { success: true, data: events };
  }

  @Get('report/daily/:contractAddress')
  @ApiOperation({ summary: 'Get daily report for a specific contract' })
  @ApiParam({ name: 'contractAddress', description: 'Contract address for daily report' })
  @ApiQuery({ name: 'eventType', description: 'Type of event to filter', required: false })
  @ApiResponse({ status: 200, description: 'Daily report retrieved successfully', type: GetReportDailyResponseDto })
  async getReportDailyByContract(
    @Param() params: GetReportDailyParamsDto,
    @Query() query: GetReportDailyQueryDto
  ): Promise<GetReportDailyResponseDto> {
    const events = await this.web3Service.getReportDaily(params.contractAddress, query.eventType);
    return { success: true, data: events };
  }
} 