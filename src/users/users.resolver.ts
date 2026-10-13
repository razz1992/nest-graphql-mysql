import {
  Args,
  Context,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import DataLoader from 'dataloader';

import { Post } from '../posts/entities/post.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { User } from './user.entity';
import { UsersService } from './users.service';
import type { UserPostsPageKey } from '../loaders/loaders.factory';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => [User])
  users(
    @Args('limit', { type: () => Int, defaultValue: 10 })
    limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 })
    offset: number,
  ) {
    return this.usersService.findAll(limit, offset);
  }

  @Query(() => User)
  user(
    @Args('id', { type: () => Int })
    id: number,
  ) {
    return this.usersService.findOne(id);
  }

  @Mutation(() => User)
  createUser(
    @Args('createUserInput')
    createUserInput: CreateUserInput,
  ) {
    return this.usersService.create(createUserInput);
  }

  @Mutation(() => User)
  updateUser(
    @Args('updateUserInput')
    updateUserInput: UpdateUserInput,
  ) {
    return this.usersService.update(updateUserInput);
  }

  @Mutation(() => Boolean)
  deleteUser(
    @Args('id', { type: () => Int })
    id: number,
  ) {
    return this.usersService.remove(id);
  }

  @ResolveField(() => [Post])
  posts(
    @Parent() user: User,
    @Args('limit', { type: () => Int, defaultValue: 10 })
    limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 })
    offset: number,
    @Context()
    context: {
      userPostsLoader: DataLoader<UserPostsPageKey, Post[]>;
    },
  ) {
    return context.userPostsLoader.load({
      userId: user.id,
      limit,
      offset,
    });
  }
}
