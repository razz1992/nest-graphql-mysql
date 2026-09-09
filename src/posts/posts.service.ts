
import {  Injectable,  NotFoundException,  BadRequestException,} from '@nestjs/common';
import {  InjectRepository,} from '@nestjs/typeorm';
import {  Repository,} from 'typeorm';

import { Post } from './entities/post.entity';
import { User } from '../users/user.entity';
import { CreatePostInput } from './dto/create-post.input';

@Injectable()
export class PostsService {

  constructor(
    @InjectRepository(Post)
    private readonly postRepository:
      Repository<Post>,

    @InjectRepository(User)
    private readonly userRepository:
      Repository<User>,
  ) {}

  async create(
    input: CreatePostInput,
  ): Promise<Post> {

    // ---Razz 
  console.log('CREATE POST INPUT:', input);
  console.log('USER ID:', input.userId);

  if (input.userId === undefined || input.userId === null) {
    throw new BadRequestException(
      'userId is required',
    );
  }

  // ---Razz end


    const user =
      await this.userRepository.findOne({
        where: {
          id: input.userId,
        },
      });

    if (!user) {
      throw new NotFoundException(
        `User ${input.userId} not found`,
      );
    }

    const post =
      this.postRepository.create({
        title: input.title,
        content: input.content,
        user,
      });

    return this.postRepository.save(post);
  }

  findAll(): Promise<Post[]> {

    return this.postRepository.find({
      relations: {
        user: true,
      },
    });
  }

  async findOne(id: number): Promise<Post> {

    const post =
      await this.postRepository.findOne({
        where: { id },

        relations: {
          user: true,
        },
      });

    if (!post) {
      throw new NotFoundException(
        `Post ${id} not found`,
      );
    }

    return post;
  }
}
