import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Web3Service } from './web3/web3.service';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  // Serve static files
  app.useStaticAssets(join(__dirname, '..', 'public'));
  
  const web3Service = app.get(Web3Service);
  await web3Service.connect();
  await web3Service.subscribeToContractEvents();
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
