import type { Request, RequestHandler } from 'express';
import { Types } from 'mongoose';
import { redisKeys } from '../constants/redisKeys.js';
import { unauthorized } from '../utils/AppError.js';
import { RedisCache } from '../utils/cache.js';
import { SessionRepository } from '../Repository/session.repository.js';
import { UserRepository, type UserDocument } from '../Repository/user.repository.js';

export class AuthMiddleware {
  constructor(
    private readonly sessions = new SessionRepository(),
    private readonly users = new UserRepository(),
  ) {}

  private readToken(req: Request): string | undefined {
    const header = req.header('authorization');
    if (!header) return undefined;

    const [scheme, token] = header.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) return undefined;
    return token;
  }

  handle: RequestHandler = async (req, _res, next) => {
    try {
      const token = this.readToken(req);
      if (!token) {
        next(unauthorized('Not authenticated'));
        return;
      }

      const cachedUserId = await RedisCache.get(redisKeys.session(token));
      const user =
        cachedUserId && Types.ObjectId.isValid(cachedUserId)
          ? await this.users.findById(new Types.ObjectId(cachedUserId))
          : await this.userFromDatabase(token);

      if (!user) {
        next(unauthorized('Session expired or invalid'));
        return;
      }

      req.auth = {
        userId: user._id,
        name: user.name,
        email: user.email,
        token,
      };
      next();
    } catch (err) {
      next(err);
    }
  };

  /** Cache miss: MongoDB is the source of truth, then the session is copied back to Redis. */
  private async userFromDatabase(token: string): Promise<UserDocument | null> {
    const session = await this.sessions.findValidByToken(token);
    if (!session) return null;

    const user = await this.users.findById(session.userId);
    if (!user) return null;

    const ttl = Math.floor((session.expiresAt.getTime() - Date.now()) / 1000);
    await RedisCache.set(redisKeys.session(token), user._id.toString(), ttl);
    await RedisCache.sadd(redisKeys.userSessions(user._id.toString()), token, ttl);
    return user;
  }
}

export const currentUser = (req: Request): NonNullable<Request['auth']> => {
  if (!req.auth) throw unauthorized();
  return req.auth;
};

export const authMiddleware = new AuthMiddleware();
export const authenticate = authMiddleware.handle;
