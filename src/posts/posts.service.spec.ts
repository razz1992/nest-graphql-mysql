import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { User } from '../users/user.entity';
import { Post } from './entities/post.entity';
import { PostsService } from './posts.service';

describe('PostsService pagination', () => {
  let service: PostsService;
  let postRepository: { find: jest.Mock };

  beforeEach(() => {
    postRepository = { find: jest.fn().mockResolvedValue([]) };
    service = new PostsService(
      postRepository as unknown as Repository<Post>,
      {} as Repository<User>,
    );
  });

  it('uses the default limit and offset', async () => {
    await service.findAll();

    expect(postRepository.find).toHaveBeenCalledWith({
      relations: { user: true },
      take: 10,
      skip: 0,
      order: { id: 'ASC' },
    });
  });

  it('passes the requested limit and offset to the database', async () => {
    await service.findAll(10, 20);

    expect(postRepository.find).toHaveBeenCalledWith({
      relations: { user: true },
      take: 10,
      skip: 20,
      order: { id: 'ASC' },
    });
  });

  it('rejects an invalid limit before querying the database', () => {
    expect(() => service.findAll(0, 0)).toThrow(BadRequestException);
    expect(postRepository.find).not.toHaveBeenCalled();
  });

  it('rejects a negative offset before querying the database', () => {
    expect(() => service.findAll(10, -1)).toThrow(BadRequestException);
    expect(postRepository.find).not.toHaveBeenCalled();
  });
});
