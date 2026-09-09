import {
  Injectable,
} from '@nestjs/common';

import {
  InjectRepository,
} from '@nestjs/typeorm';

import {
  Repository,
} from 'typeorm';

import DataLoader from 'dataloader';

import { Post } from '../posts/entities/post.entity';

@Injectable()
export class LoadersFactory {

  constructor(
    @InjectRepository(Post)
    private readonly postRepository:
      Repository<Post>,
  ) {}

  createUserPostsLoader() {

    return new DataLoader<number, Post[]>(
      async (userIds) => {

        console.log(
          'UserPostsLoader batch:',
          userIds,
        );

        const posts =
          await this.postRepository
            .createQueryBuilder('post')
            .leftJoinAndSelect(
              'post.user',
              'user',
            )
            .where(
              'user.id IN (:...userIds)',
              {
                userIds,
              },
            )
            .getMany();

        const postsByUserId =
          new Map<number, Post[]>();

        for (const userId of userIds) {
          postsByUserId.set(
            userId,
            [],
          );
        }

        for (const post of posts) {

          const userId =
            post.user.id;

          postsByUserId
            .get(userId)!
            .push(post);
        }

        return userIds.map(
          (userId) =>
            postsByUserId.get(userId) ?? [],
        );
      },
    );
  }
}