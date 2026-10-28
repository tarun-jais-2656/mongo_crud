import { Types } from 'mongoose';
import { z } from 'zod';
import { COMMENT_LIMITS } from '../../constants/index.js';
import { Paginator } from '../../utils/pagination.js';
import { blankToUndefined, safeText } from '../../utils/validators.js';

export const createCommentDto = z.strictObject({
  text: safeText('text').refine(
    (value) => value.length >= COMMENT_LIMITS.TEXT_MIN && value.length <= COMMENT_LIMITS.TEXT_MAX,
    `text must be ${COMMENT_LIMITS.TEXT_MIN} to ${COMMENT_LIMITS.TEXT_MAX} characters`,
  ),
});
export type CreateCommentDto = z.infer<typeof createCommentDto>;

export const commentListQueryDto = Paginator.query.extend({
  // Bonus: cursor pagination. When present, we page by _id instead of page/limit.
  after: z.preprocess(
    blankToUndefined,
    z
      .string()
      .refine((value) => Types.ObjectId.isValid(value), 'after must be a valid comment id')
      .optional(),
  ),
});
export type CommentListQueryDto = z.infer<typeof commentListQueryDto>;
