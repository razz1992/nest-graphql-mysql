import {  Args,  Int,  Mutation,  Query,  Resolver, Parent,  ResolveField,Context, } 
from '@nestjs/graphql';

import DataLoader from 'dataloader';

import { User } from './user.entity';
import { UsersService } from './users.service';

import {  CreateUserInput,} from './dto/create-user.input';
import {  UpdateUserInput,} from './dto/update-user.input';
import { Post } from '../posts/entities/post.entity';


@Resolver(() => User)
export class UsersResolver {

  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Query(() => [User])
  users() {
    return this.usersService.findAll();
  }

  @Query(() => User)
  user(
    @Args('id', {
      type: () => Int,
    })
    id: number,
  ) {
    return this.usersService.findOne(id);
  }

  @Mutation(() => User)
  createUser(
    @Args('createUserInput')
    createUserInput: CreateUserInput,
  ) {
    return this.usersService.create(
      createUserInput,
    );

  }


  @Mutation(() => User)
updateUser(
  @Args('updateUserInput')
  updateUserInput: UpdateUserInput,
) {
  return this.usersService.update(
    updateUserInput,
  );

}


@Mutation(() => Boolean)
deleteUser(
  @Args('id', {
    type: () => Int,
  })
  id: number,
) {
  return this.usersService.remove(id);
}



@ResolveField(() => [Post])
posts(
  @Parent() user: User,

  @Context()
  context: {
    userPostsLoader:
      DataLoader<number, Post[]>;
  },
) {

  return context.userPostsLoader.load(
    user.id,
  );
}


}

