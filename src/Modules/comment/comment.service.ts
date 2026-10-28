import { Types } from 'mongoose';
import { forbidden, notFound } from '../../utils/AppError.js';
import { Paginator, type PaginationMeta } from '../../utils/pagination.js';
import { CommentRepository, type CommentDocument } from '../../Repository/comment.repository.js';
import { PostRepository } from '../../Repository/post.repository.js';
import type { CommentListQueryDto, CreateCommentDto } from './comment.dto.js';

export interface OffsetResult {
  data: unknown[];
  pagination: PaginationMeta;
}
export interface CursorResult {
  data: unknown[];
  nextCursor: string | null;
}

export class CommentService {
  constructor(
    private readonly comments = new CommentRepository(),
    private readonly posts = new PostRepository(),
  ) {}

  async addComment(
    postId: Types.ObjectId,
    userId: Types.ObjectId,
    userName: string,
    input: CreateCommentDto,
  ): Promise<CommentDocument> {
    const post = await this.posts.findById(postId);
    if (!post) throw notFound('Post not found');
    if (post.status !== 'published') throw forbidden('You can only comment on published posts');

    const comment = await this.comments.create({ postId, userId, userName, text: input.text });

    // Keep the denormalised counter in sync.
    await this.posts.changeCommentCount(postId, 1);
    return comment;
  }

  async listComments(
    postId: Types.ObjectId,
    query: CommentListQueryDto,
  ): Promise<OffsetResult | CursorResult> {
    const post = await this.posts.findById(postId);
    if (!post || post.status !== 'published') throw notFound('Post not found');

    // Cursor mode (bonus): ?after=<lastCommentId>
    if (query.after !== undefined) {
      const docs = await this.comments.listByPostAfter(
        postId,
        query.limit,
        new Types.ObjectId(query.after),
      );
      const last = docs.at(-1);
      return {
        data: docs,
        nextCursor: docs.length === query.limit && last ? last._id.toString() : null,
      };
    }

    // Default offset mode.
    return Paginator.paginate(
      query.page,
      query.limit,
      await this.comments.listByPost(postId, query.page, query.limit),
    );
  }

  async deleteComment(userId: Types.ObjectId, commentId: Types.ObjectId): Promise<void> {
    const comment = await this.comments.findById(commentId);
    if (!comment) throw notFound('Comment not found');

    const post = await this.posts.findById(comment.postId);
    const isCommentAuthor = comment.userId.equals(userId);
    const isPostAuthor = post ? post.author.equals(userId) : false;
    if (!isCommentAuthor && !isPostAuthor) {
      throw forbidden('You cannot delete this comment');
    }

    await this.comments.deleteById(commentId);
    // Only decrement if the post still exists.
    if (post) await this.posts.changeCommentCount(comment.postId, -1);
  }
}
