import { model, Schema, Types, type Model } from 'mongoose';
import { POST_LIMITS, POST_STATUS, type PostStatus } from '../constants/index.js';

export interface IPost {
  _id: Types.ObjectId;
  title: string;
  body: string;
  tags: string[];
  author: Types.ObjectId;
  authorName: string;
  status: PostStatus;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: [true, 'title is required'],
      trim: true,
      minlength: [POST_LIMITS.TITLE_MIN, `title must be at least ${POST_LIMITS.TITLE_MIN} characters`],
      maxlength: [POST_LIMITS.TITLE_MAX, `title must be at most ${POST_LIMITS.TITLE_MAX} characters`],
    },
    body: {
      type: String,
      required: [true, 'body is required'],
      minlength: [POST_LIMITS.BODY_MIN, `body must be at least ${POST_LIMITS.BODY_MIN} characters`],
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (tags: string[]) => tags.length <= POST_LIMITS.MAX_TAGS,
        message: `a post can have at most ${POST_LIMITS.MAX_TAGS} tags`,
      },
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: POST_STATUS,
      default: 'draft',
    },
    commentCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

// Index on tags (Part 6).
postSchema.index({ tags: 1 });
// Compound index for the published-posts feed sorted by newest.
postSchema.index({ status: 1, createdAt: -1 });

export const PostModel: Model<IPost> = model<IPost>('Post', postSchema);
