import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Web3Module } from './web3/web3.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
  imports: [Web3Module, WebsocketModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
