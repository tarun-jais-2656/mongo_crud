import { model, Schema, Types, type Model } from 'mongoose';

export interface ISession {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  token: string;
  expiresAt: Date;
  userAgent: string;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  { timestamps: true },
);

// Unique index on the token (Part 6).
sessionSchema.index({ token: 1 }, { unique: true });

// TTL index: MongoDB removes a session the moment expiresAt passes.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const SessionModel: Model<ISession> = model<ISession>('Session', sessionSchema);
