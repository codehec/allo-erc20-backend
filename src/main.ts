import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Web3Service } from './web3/web3.service';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  const config = new DocumentBuilder()
    .setTitle('Blockchain Events API')
    .setDescription('API for blockchain events')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  // Serve static files
  app.useStaticAssets(join(__dirname, '..', 'public'));
  
  const web3Service = app.get(Web3Service);
  await web3Service.connect();
  await web3Service.subscribeToContractEvents();
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
