import {  Args,  Int,  Mutation,  Query,  Resolver,} from '@nestjs/graphql';

import { Post } from './entities/post.entity';
import { PostsService } from './posts.service';

import {
  CreatePostInput,
} from './dto/create-post.input';

@Resolver(() => Post)
export class PostsResolver {

  constructor(
    private readonly postsService:
      PostsService,
  ) {}

  @Query(() => [Post])
  posts() {

    return this.postsService.findAll();
  }

  @Query(() => Post)
  post(
    @Args('id', {
      type: () => Int,
    })
    id: number,
  ) {
    return this.postsService.findOne(id);
  }

  @Mutation(() => Post)
  createPost(
    @Args('createPostInput')
    createPostInput: CreatePostInput,
  ) {

    return this.postsService.create(
      createPostInput,
    );

  }
}