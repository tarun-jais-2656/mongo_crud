import { z } from 'zod';
import { POST_LIMITS, POST_SORTS, POST_STATUS } from '../../constants/index.js';
import { Paginator } from '../../utils/pagination.js';
import { blankToUndefined, safeText } from '../../utils/validators.js';

const singleTag = safeText('tag')
  .transform((value) => value.toLowerCase())
  .refine((value) => value.length >= 1 && value.length <= 30, 'each tag must be 1 to 30 characters');

const tags = z
  .array(singleTag)
  .max(POST_LIMITS.MAX_TAGS, `a post can have at most ${POST_LIMITS.MAX_TAGS} tags`)
  .transform((list) => Array.from(new Set(list)));

const title = safeText('title').refine(
  (value) => value.length >= POST_LIMITS.TITLE_MIN && value.length <= POST_LIMITS.TITLE_MAX,
  `title must be ${POST_LIMITS.TITLE_MIN} to ${POST_LIMITS.TITLE_MAX} characters`,
);

const body = z
  .string({ required_error: 'body is required', invalid_type_error: 'body must be a string' })
  .trim()
  .min(POST_LIMITS.BODY_MIN, `body must be at least ${POST_LIMITS.BODY_MIN} characters`);

export const createPostDto = z.strictObject({
  title,
  body,
  tags: tags.optional().default([]),
  status: z.enum(POST_STATUS).optional().default('draft'),
});
export type CreatePostDto = z.infer<typeof createPostDto>;

export const updatePostDto = z
  .strictObject({
    title: title.optional(),
    body: body.optional(),
    tags: tags.optional(),
    status: z.enum(POST_STATUS).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'Provide at least one field to update');
export type UpdatePostDto = z.infer<typeof updatePostDto>;

const searchQuery = safeText('search').refine(
  (value) => value.length <= 100,
  'search must be at most 100 characters',
);

export const listPostsQueryDto = Paginator.query.extend({
  search: z.preprocess(blankToUndefined, searchQuery.optional()),
  tag: z.preprocess(blankToUndefined, singleTag.optional()),
  sort: z.preprocess(blankToUndefined, z.enum(POST_SORTS).default('newest')),
});
export type ListPostsQueryDto = z.infer<typeof listPostsQueryDto>;
