import { Module, forwardRef } from '@nestjs/common';
import { BlockchainEventsGateway } from './websocket.gateway';
import { WebsocketController } from './websocket.controller';
import { Web3Module } from '../web3/web3.module';

@Module({
  imports: [forwardRef(() => Web3Module)],
  controllers: [WebsocketController],
  providers: [BlockchainEventsGateway],
  exports: [BlockchainEventsGateway],
})
export class WebsocketModule {} 