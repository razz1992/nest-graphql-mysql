import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import DataLoader from 'dataloader';
import { Repository } from 'typeorm';

import {
  normalizePagination,
  PaginationParams,
} from '../common/pagination';
import { Post } from '../posts/entities/post.entity';
import { User } from '../users/user.entity';

export interface UserPostsPageKey extends PaginationParams {
  userId: number;
}

interface PostPageRow {
  page_index: number | string;
  post_id: number | string;
  post_title: string;
  post_content: string;
  user_id: number | string;
  user_name: string;
  user_email: string;
}

@Injectable()
export class LoadersFactory {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  /**
   * Batch nested User.posts pages into one SQL statement. Each user's page is
   * limited in the database, while DataLoader still batches sibling fields.
   */
  createUserPostsLoader() {
    return new DataLoader<UserPostsPageKey, Post[]>(
      async (keys) => {
        const pageResults: Post[][] = keys.map(() => []);
        if (keys.length === 0) {
          return pageResults;
        }

        const parameters: Array<number> = [];
        const pageQueries = keys.map((key, pageIndex) => {
          const pagination = normalizePagination(key.limit, key.offset);
          parameters.push(key.userId, pagination.limit, pagination.offset);

          return `(SELECT ${pageIndex} AS _page_index,
                    p.id, p.title, p.content, p.userId
              FROM \`post\` p
              WHERE p.userId = ?
              ORDER BY p.id ASC
              LIMIT ? OFFSET ?)`;
        });

        const sql = `
          SELECT
            page._page_index AS page_index,
            page.id AS post_id,
            page.title AS post_title,
            page.content AS post_content,
            page.userId AS post_user_id,
            u.id AS user_id,
            u.name AS user_name,
            u.email AS user_email
          FROM (${pageQueries.join('\nUNION ALL\n')}) AS page
          INNER JOIN \`user\` u ON u.id = page.userId
          ORDER BY page._page_index ASC, page.id ASC
        `;

        const rows = (await this.postRepository.query(
          sql,
          parameters,
        )) as PostPageRow[];

        for (const row of rows) {
          const pageIndex = Number(row.page_index);
          const user = {
            id: Number(row.user_id),
            name: row.user_name,
            email: row.user_email,
          } as User;

          pageResults[pageIndex].push(
            this.postRepository.create({
              id: Number(row.post_id),
              title: row.post_title,
              content: row.post_content,
              user,
            }),
          );
        }

        return pageResults;
      },
      {
        cacheKeyFn: (key) =>
          `${key.userId}:${key.limit}:${key.offset}`,
      },
    );
  }
}
