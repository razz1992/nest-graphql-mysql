import { BadRequestException } from '@nestjs/common';

export const DEFAULT_PAGE_LIMIT = 10;
export const DEFAULT_PAGE_OFFSET = 0;
export const MAX_PAGE_LIMIT = 100;

export interface PaginationParams {
  limit: number;
  offset: number;
}

/**
 * Validate pagination values at the service boundary as well as for GraphQL
 * callers, so internal service callers cannot accidentally request an
 * unbounded result set.
 */
export function normalizePagination(
  limit: number = DEFAULT_PAGE_LIMIT,
  offset: number = DEFAULT_PAGE_OFFSET,
): PaginationParams {
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_LIMIT) {
    throw new BadRequestException(
      `limit must be an integer between 1 and ${MAX_PAGE_LIMIT}`,
    );
  }

  if (!Number.isInteger(offset) || offset < 0) {
    throw new BadRequestException(
      'offset must be a non-negative integer',
    );
  }

  return { limit, offset };
}
