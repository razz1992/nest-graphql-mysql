jest.mock('@nestjs/common', () => ({
  BadRequestException: class BadRequestException extends Error {},
}));

import { BadRequestException } from '@nestjs/common';
import {
  DEFAULT_PAGE_LIMIT,
  DEFAULT_PAGE_OFFSET,
  MAX_PAGE_LIMIT,
  normalizePagination,
} from './pagination';

describe('normalizePagination', () => {
  it('uses the default page when values are omitted', () => {
    expect(normalizePagination()).toEqual({
      limit: DEFAULT_PAGE_LIMIT,
      offset: DEFAULT_PAGE_OFFSET,
    });
  });

  it('accepts a valid limit and offset', () => {
    expect(normalizePagination(10, 20)).toEqual({
      limit: 10,
      offset: 20,
    });
  });

  it('allows the configured maximum limit', () => {
    expect(normalizePagination(MAX_PAGE_LIMIT, 0).limit).toBe(
      MAX_PAGE_LIMIT,
    );
  });

  it.each([0, -1, MAX_PAGE_LIMIT + 1, 1.5])(
    'rejects invalid limit %s',
    (limit) => {
      expect(() => normalizePagination(limit, 0)).toThrow(
        BadRequestException,
      );
    },
  );

  it.each([-1, 1.5])('rejects invalid offset %s', (offset) => {
    expect(() => normalizePagination(10, offset)).toThrow(
      BadRequestException,
    );
  });
});
