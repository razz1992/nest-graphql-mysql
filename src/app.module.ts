import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import {  ApolloDriver,  ApolloDriverConfig,} from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';

import {  LoadersFactory,} from './loaders/loaders.factory';

import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { LoadersModule } from './loaders/loaders.module';

import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

console.log('APPKEY=', process.env.OBSERVABILITY_APPKEY);

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey :  process.env.OBSERVABILITY_APPKEY! ,
      appSecret: process.env.OBSERVABILITY_APPSECRET!,
      serviceId: process.env.OBSERVABILITY_SERVICEID!,
    }),
    
    

    GraphQLModule.forRootAsync<
      ApolloDriverConfig
    >({
      driver: ApolloDriver,
      imports: [
        LoadersModule,
      ],
      inject: [
        LoadersFactory,
      ],
      useFactory: (
        loadersFactory: LoadersFactory,
      ) => ({
        autoSchemaFile: true,
        graphiql: true,
        context: () => ({
          userPostsLoader:
            loadersFactory
              .createUserPostsLoader(),
        }),
      }),
    }),

    TypeOrmModule.forRoot({
      type: 'mysql',
      host:  process.env.MYSQL_DB_HOST!,
      port: 3306,
      username:  process.env.MYSQL_DB_USER!,
      password: process.env.MYSQL_DB_PASSWORD!,
      database: 'graphql_demo',
      autoLoadEntities: true,
      synchronize: true,
    }),

    UsersModule,

    PostsModule,

    LoadersModule,

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

