 import * as fs from 'fs';

 import { NestFactory } from '@nestjs/core';
import {  ValidationPipe, } from '@nestjs/common';

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { AppModule, 
//  ObserveInstrument 
} from './app.module';

async function bootstrap() {
  const httpsOptions = {
    key: fs.readFileSync('./certs/key.pem'),
    cert: fs.readFileSync('./certs/cert.pem'),
    passphrase: 'rajua',
  };
  
  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  })//,{
    // instrument: ObserveInstrument,
  // });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  await app.listen((process.env.PORT! ) ?? 3000);
}
bootstrap();



