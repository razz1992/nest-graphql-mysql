import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  DEFAULT_PAGE_LIMIT,
  DEFAULT_PAGE_OFFSET,
  normalizePagination,
} from '../common/pagination';
import { User } from '../users/user.entity';
import { CreatePostInput } from './dto/create-post.input';
import { Post } from './entities/post.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(input: CreatePostInput): Promise<Post> {
    console.log('CREATE POST INPUT:', input);
    console.log('USER ID:', input.userId);

    if (input.userId === undefined || input.userId === null) {
      throw new BadRequestException('userId is required');
    }

    const user = await this.userRepository.findOne({
      where: { id: input.userId },
    });

    if (!user) {
      throw new NotFoundException(`User ${input.userId} not found`);
    }

    const post = this.postRepository.create({
      title: input.title,
      content: input.content,
      user,
    });

    return this.postRepository.save(post);
  }

  findAll(
    limit: number = DEFAULT_PAGE_LIMIT,
    offset: number = DEFAULT_PAGE_OFFSET,
  ): Promise<Post[]> {
    const pagination = normalizePagination(limit, offset);

    return this.postRepository.find({
      relations: { user: true },
      take: pagination.limit,
      skip: pagination.offset,
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: { user: true },
    });

    if (!post) {
      throw new NotFoundException(`Post ${id} not found`);
    }

    return post;
  }
}
