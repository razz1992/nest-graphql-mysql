import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';

import { CreatePostInput } from './dto/create-post.input';
import { Post } from './entities/post.entity';
import { PostsService } from './posts.service';

@Resolver(() => Post)
export class PostsResolver {
  constructor(private readonly postsService: PostsService) {}

  @Query(() => [Post])
  posts(
    @Args('limit', { type: () => Int, defaultValue: 10 })
    limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 })
    offset: number,
  ) {
    return this.postsService.findAll(limit, offset);
  }

  @Query(() => Post)
  post(
    @Args('id', { type: () => Int })
    id: number,
  ) {
    return this.postsService.findOne(id);
  }

  @Mutation(() => Post)
  createPost(
    @Args('createPostInput')
    createPostInput: CreatePostInput,
  ) {
    return this.postsService.create(createPostInput);
  }
}
