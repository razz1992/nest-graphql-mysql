import { NestFactory } from '@nestjs/core';
import {  ValidationPipe, } from '@nestjs/common';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.prod' });

import { AppModule, 
//  ObserveInstrument 
} from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // instrument: ObserveInstrument,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  await app.listen((process.env.PORT! ) ?? 3000);
}
bootstrap();



