import { readFileSync } from 'node:fs';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { LoadersFactory } from './loaders/loaders.factory';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { LoadersModule } from './loaders/loaders.module';
import configuration from './config/configuration';
import { validateEnvironment } from './config/env.validation';
import { loadEnvironmentVariables } from './config/load-environment';

loadEnvironmentVariables();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
      load: [configuration],
      validate: validateEnvironment,
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [LoadersModule],
      inject: [LoadersFactory],
      useFactory: (loadersFactory: LoadersFactory) => ({
        autoSchemaFile: true,
        graphiql: true,
        introspection: true,
        context: () => ({
          userPostsLoader: loadersFactory.createUserPostsLoader(),
        }),
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const mysqlSslCaPath = configService.get<string>('database.sslCaPath');
        return {
          type: 'mysql' as const,
          host: configService.getOrThrow<string>('database.host'),
          port: configService.getOrThrow<number>('database.port'),
          username: configService.getOrThrow<string>('database.username'),
          password: configService.getOrThrow<string>('database.password'),
          database: configService.getOrThrow<string>('database.name'),
          ssl: mysqlSslCaPath
            ? { ca: readFileSync(mysqlSslCaPath), rejectUnauthorized: true }
            : undefined,
          autoLoadEntities: true,
          synchronize: true,
        };
      },
    }),
    UsersModule,
    PostsModule,
    LoadersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
