import { type HydratedDocument, type Types } from 'mongoose';
import { CommentModel, type IComment } from '../model/comment.model.js';
import { Paginator, type PageRows } from '../utils/pagination.js';

export interface NewComment {
  postId: Types.ObjectId;
  userId: Types.ObjectId;
  userName: string;
  text: string;
}

export type CommentDocument = HydratedDocument<IComment>;

export class CommentRepository {
  create(input: NewComment): Promise<CommentDocument> {
    return CommentModel.create(input);
  }

  findById(id: Types.ObjectId): Promise<CommentDocument | null> {
    return CommentModel.findById(id).exec();
  }

  async deleteById(id: Types.ObjectId): Promise<boolean> {
    const result = await CommentModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async deleteByPost(postId: Types.ObjectId): Promise<number> {
    const result = await CommentModel.deleteMany({ postId }).exec();
    return result.deletedCount;
  }

  /** Offset pagination: newest-first page + total, in one $facet query. */
  listByPost(postId: Types.ObjectId, page: number, limit: number): Promise<PageRows> {
    return Paginator.aggregate(CommentModel, { postId }, [
      { $sort: { createdAt: -1 } },
      ...Paginator.slice(page, limit),
    ]);
  }

  /**
   * Cursor pagination (bonus): return `limit` comments older than `after`.
   * Because _id is monotonic, "newest first" means _id descending; the next page
   * is everything with _id < the last id we saw.
   */
  listByPostAfter(
    postId: Types.ObjectId,
    limit: number,
    after?: Types.ObjectId,
  ): Promise<CommentDocument[]> {
    const query: Record<string, unknown> = { postId };
    if (after) query._id = { $lt: after };
    return CommentModel.find(query).sort({ _id: -1 }).limit(limit).exec();
  }
}
