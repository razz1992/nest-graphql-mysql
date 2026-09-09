import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { Post } from '../posts/entities/post.entity';

import { LoadersFactory } from './loaders.factory';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
    ]),
  ],

  providers: [
    LoadersFactory,
  ],

  exports: [
    LoadersFactory,
  ],
})
export class LoadersModule {}
