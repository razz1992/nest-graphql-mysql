import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Post } from '../posts/entities/post.entity';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';


@Module({
    imports: [
    TypeOrmModule.forFeature([User,Post,]),
  ],
    providers: [UsersResolver, UsersService],
})
export class UsersModule {}



//
