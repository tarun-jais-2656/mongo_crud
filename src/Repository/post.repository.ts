import { type HydratedDocument, type Types } from 'mongoose';
import { PostModel, type IPost } from '../model/post.model.js';
import type { PostSort, PostStatus } from '../constants/index.js';
import { Paginator, type PageRows } from '../utils/pagination.js';

export interface NewPost {
  title: string;
  body: string;
  tags: string[];
  author: Types.ObjectId;
  authorName: string;
  status: PostStatus;
}

export interface PostChanges {
  title?: string;
  body?: string;
  tags?: string[];
  status?: PostStatus;
}

export interface ListFilter {
  page: number;
  limit: number;
  search?: string;
  tag?: string;
  sort: PostSort;
}

export type PostDocument = HydratedDocument<IPost>;

/** Escape user input so it is treated literally inside a RegExp. */
const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class PostRepository {
  private sortStage(sort: PostSort): Record<string, 1 | -1> {
    switch (sort) {
      case 'oldest':
        return { createdAt: 1 };
      case 'mostCommented':
        return { commentCount: -1, createdAt: -1 };
      case 'newest':
      default:
        return { createdAt: -1 };
    }
  }

  create(input: NewPost): Promise<PostDocument> {
    return PostModel.create(input);
  }

  findById(id: Types.ObjectId): Promise<PostDocument | null> {
    return PostModel.findById(id).exec();
  }

  updateById(id: Types.ObjectId, changes: PostChanges): Promise<PostDocument | null> {
    return PostModel.findByIdAndUpdate(id, changes, { new: true, runValidators: true }).exec();
  }

  async deleteById(id: Types.ObjectId): Promise<boolean> {
    const result = await PostModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  findByAuthor(author: Types.ObjectId, page: number, limit: number): Promise<PageRows> {
    return Paginator.aggregate(PostModel, { author }, [
      { $sort: { createdAt: -1 } },
      ...Paginator.slice(page, limit),
    ]);
  }

  changeCommentCount(id: Types.ObjectId, delta: number): Promise<unknown> {
    return PostModel.updateOne({ _id: id }, { $inc: { commentCount: delta } }).exec();
  }

  listPublished(filter: ListFilter): Promise<PageRows> {
    const match: Record<string, unknown> = { status: 'published' };
    if (filter.search) {
      match.title = { $regex: escapeRegExp(filter.search), $options: 'i' };
    }
    if (filter.tag) {
      match.tags = filter.tag;
    }

    return Paginator.aggregate(PostModel, match, [
      { $sort: this.sortStage(filter.sort) },
      ...Paginator.slice(filter.page, filter.limit),
      // Projection: drop the heavy body field from the list.
      { $project: { body: 0 } },
    ]);
  }
}
