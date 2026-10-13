jest.mock('@nestjs/common', () => ({
  BadRequestException: class BadRequestException extends Error {},
  NotFoundException: class NotFoundException extends Error {},
  Injectable: () => (target: Function) => target,
}));
jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));
jest.mock('../posts/entities/post.entity', () => ({
  Post: class Post {},
}));
jest.mock('./user.entity', () => ({
  User: class User {},
}));

import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { Post } from '../posts/entities/post.entity';
import { User } from './user.entity';
import { UsersService } from './users.service';

describe('UsersService pagination', () => {
  let service: UsersService;
  let userRepository: { find: jest.Mock };

  beforeEach(() => {
    userRepository = { find: jest.fn().mockResolvedValue([]) };
    service = new UsersService(
      userRepository as unknown as Repository<User>,
      {} as Repository<Post>,
    );
  });

  it('uses the default limit and offset', async () => {
    await service.findAll();

    expect(userRepository.find).toHaveBeenCalledWith({
      take: 10,
      skip: 0,
      order: { id: 'ASC' },
    });
  });

  it('passes the requested limit and offset to the database', async () => {
    await service.findAll(10, 20);

    expect(userRepository.find).toHaveBeenCalledWith({
      take: 10,
      skip: 20,
      order: { id: 'ASC' },
    });
  });

  it('rejects an invalid limit before querying the database', () => {
    expect(() => service.findAll(101, 0)).toThrow(BadRequestException);
    expect(userRepository.find).not.toHaveBeenCalled();
  });

  it('rejects a negative offset before querying the database', () => {
    expect(() => service.findAll(10, -1)).toThrow(BadRequestException);
    expect(userRepository.find).not.toHaveBeenCalled();
  });
});
