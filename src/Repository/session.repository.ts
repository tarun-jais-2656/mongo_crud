import { type HydratedDocument, type Types } from 'mongoose';
import { SessionModel, type ISession } from '../model/session.model.js';

export interface NewSession {
  userId: Types.ObjectId;
  token: string;
  expiresAt: Date;
  userAgent: string;
}

export type SessionDocument = HydratedDocument<ISession>;

export class SessionRepository {
  create(input: NewSession): Promise<SessionDocument> {
    return SessionModel.create(input);
  }

  findValidByToken(token: string): Promise<SessionDocument | null> {
    return SessionModel.findOne({ token, expiresAt: { $gt: new Date() } }).exec();
  }

  async deleteByToken(token: string): Promise<boolean> {
    const result = await SessionModel.deleteOne({ token }).exec();
    return result.deletedCount > 0;
  }

  async deleteAllForUser(userId: Types.ObjectId): Promise<number> {
    const result = await SessionModel.deleteMany({ userId }).exec();
    return result.deletedCount;
  }
}
