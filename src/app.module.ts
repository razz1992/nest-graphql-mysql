import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { LoadersFactory } from './loaders/loaders.factory';

// testing jenkins 2

//  import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { LoadersModule } from './loaders/loaders.module';
import configuration from './config/configuration';
import { validateEnvironment } from './config/env.validation';
import { loadEnvironmentVariables } from './config/load-environment';

loadEnvironmentVariables();

// export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
      load: [configuration],
      validate: validateEnvironment,
    }),

    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    // ObserveModule.forRoot({
    //   appKey :  process.env.OBSERVABILITY_APPKEY! ,
    //   appSecret: process.env.OBSERVABILITY_APPSECRET!,
    //   serviceId: process.env.OBSERVABILITY_SERVICEID!,
    // }),

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
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.getOrThrow<string>('database.host'),
        port: configService.getOrThrow<number>('database.port'),
        username: configService.getOrThrow<string>('database.username'),
        password: configService.getOrThrow<string>('database.password'),
        database: configService.getOrThrow<string>('database.name'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),

    UsersModule,

    PostsModule,

    LoadersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
