import type { Types } from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: Types.ObjectId;
        name: string;
        email: string;
        sessionId?: Types.ObjectId;
        token: string;
      };
    }
  }
}

export {};
