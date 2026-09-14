import { readFileSync } from 'node:fs';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import dotenv from 'dotenv';
dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.local',
});

import {
  AppModule,
  //  ObserveInstrument
} from './app.module';

function getHttpsOptions() {
  const keyPath = process.env.SSL_KEY_PATH;
  const certPath = process.env.SSL_CERT_PATH;

  if (!keyPath && !certPath) {
    return undefined;
  }

  if (!keyPath || !certPath) {
    throw new Error('Both SSL_KEY_PATH and SSL_CERT_PATH must be set to enable HTTPS.');
  }

  return {
    key: readFileSync(keyPath),
    cert: readFileSync(certPath),
    passphrase: process.env.SSL_PASSPHRASE,
  };
}

async function bootstrap() {
  const httpsOptions = getHttpsOptions();
  const app = await NestFactory.create(
    AppModule,
    httpsOptions
      ? {
          httpsOptions,
        }
      : {},
  ); //,{
  // instrument: ObserveInstrument,
  // });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
