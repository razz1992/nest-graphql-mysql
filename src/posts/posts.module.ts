import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsResolver } from './posts.resolver';
import { Post } from './entities/post.entity';
import { User } from '../users/user.entity';

@Module({
  providers: [PostsService,    PostsResolver,],
  imports: [
    TypeOrmModule.forFeature([Post,User,]),
  ],
})
export class PostsModule {}

