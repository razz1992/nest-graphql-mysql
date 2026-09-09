import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import {  ApolloDriver,  ApolloDriverConfig,} from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';

import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'nest-graphql-mysql',
    }),

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // Generate schema automatically
      autoSchemaFile: true,
      // GraphQL browser IDE
      graphiql: true,
    }),

    TypeOrmModule.forRoot({
      type: 'mysql',
      host: '127.0.0.1',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'graphql_demo',
      autoLoadEntities: true,
      synchronize: true,
    }),

    UsersModule,

    PostsModule,

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}


