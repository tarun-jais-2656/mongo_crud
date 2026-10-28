import { model, Schema, Types, type Model } from 'mongoose';
import { USER_LIMITS } from '../constants/index.js';

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'name is required'],
      trim: true,
      minlength: [USER_LIMITS.NAME_MIN, `name must be at least ${USER_LIMITS.NAME_MIN} characters`],
      maxlength: [USER_LIMITS.NAME_MAX, `name must be at most ${USER_LIMITS.NAME_MAX} characters`],
    },
    email: {
      type: String,
      required: [true, 'email is required'],
      lowercase: true,
      trim: true,
    },
    // `select: false` keeps the hash out of every query result by default,
    // so it can never leak into a response.
    password: {
      type: String,
      required: [true, 'password is required'],
      select: false,
    },
  },
  {
    timestamps: true,
    // Extra guard: strip password if a document is ever serialised directly.
    toJSON: {
      transform: (_doc, ret) => {
        delete (ret as Record<string, unknown>).password;
        return ret;
      },
    },
  },
);

// Unique index on email (Part 6).
userSchema.index({ email: 1 }, { unique: true });

export const UserModel: Model<IUser> = model<IUser>('User', userSchema);
