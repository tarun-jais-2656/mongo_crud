import { model, Schema, Types, type Model } from 'mongoose';
import { COMMENT_LIMITS } from '../constants/index.js';

export interface IComment {
  _id: Types.ObjectId;
  postId: Types.ObjectId;
  userId: Types.ObjectId;
  userName: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: [true, 'text is required'],
      trim: true,
      minlength: [COMMENT_LIMITS.TEXT_MIN, 'text must not be empty'],
      maxlength: [COMMENT_LIMITS.TEXT_MAX, `text must be at most ${COMMENT_LIMITS.TEXT_MAX} characters`],
    },
  },
  { timestamps: true },
);

commentSchema.index({ postId: 1, createdAt: -1 });

export const CommentModel: Model<IComment> = model<IComment>('Comment', commentSchema);
