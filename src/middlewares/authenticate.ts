import type { Request, RequestHandler } from 'express';
import { unauthorized } from '../utils/AppError.js';
import { SessionRepository } from '../Repository/session.repository.js';
import { UserRepository } from '../Repository/user.repository.js';

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

      const session = await this.sessions.findValidByToken(token);
      if (!session) {
        next(unauthorized('Session expired or invalid'));
        return;
      }

      const user = await this.users.findById(session.userId);
      if (!user) {
        next(unauthorized('Session expired or invalid'));
        return;
      }

      req.auth = {
        userId: user._id,
        name: user.name,
        email: user.email,
        sessionId: session._id,
        token,
      };
      next();
    } catch (err) {
      next(err);
    }
  };
}

export const currentUser = (req: Request): NonNullable<Request['auth']> => {
  if (!req.auth) throw unauthorized();
  return req.auth;
};

export const authMiddleware = new AuthMiddleware();
export const authenticate = authMiddleware.handle;
