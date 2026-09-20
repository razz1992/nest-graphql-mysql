import { readFileSync } from 'node:fs';

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import {
  AppModule,
  //  ObserveInstrument
} from './app.module';
import { loadEnvironmentVariables } from './config/load-environment';
import { validateEnvironment } from './config/env.validation';

function getHttpsOptions(config: Record<string, unknown>) {
  const keyPath = config.SSL_KEY_PATH;
  const certPath = config.SSL_CERT_PATH;

  if (!keyPath && !certPath) {
    return undefined;
  }

  if (!keyPath || !certPath) {
    throw new Error(
      'Both SSL_KEY_PATH and SSL_CERT_PATH must be set to enable HTTPS.',
    );
  }

  return {
    key: readFileSync(String(keyPath)),
    cert: readFileSync(String(certPath)),
    passphrase: config.SSL_PASSPHRASE
      ? String(config.SSL_PASSPHRASE)
      : undefined,
  };
}

async function bootstrap() {
  loadEnvironmentVariables();

  const validatedConfig = validateEnvironment(process.env);
  const httpsOptions = getHttpsOptions(validatedConfig);
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

  const configService = app.get(ConfigService);
  const port = configService.getOrThrow<number>('app.port');

  await app.listen(port);
}
bootstrap();
