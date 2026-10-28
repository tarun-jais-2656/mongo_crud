import { timingSafeEqual } from 'node:crypto';
import type { Request, RequestHandler } from 'express';
import { getEnv } from '../config/env.js';
import { unauthorized } from '../utils/AppError.js';

const sameSecret = (left: string, right: string): boolean => {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
};

export class BasicAuthMiddleware {
  handle: RequestHandler = (req, _res, next) => {
    try {
      this.assert(req);
      next();
    } catch (err) {
      next(err);
    }
  };

  private assert(req: Request): void {
    const header = req.header('authorization');
    if (!header) {
      throw unauthorized('Basic authentication required');
    }

    const [scheme, encoded] = header.split(' ');
    if (scheme?.toLowerCase() !== 'basic' || !encoded) {
      throw unauthorized('Basic authentication required');
    }

    let decoded: string;
    try {
      decoded = Buffer.from(encoded, 'base64').toString('utf8');
    } catch {
      throw unauthorized('Invalid basic authentication');
    }

    const separator = decoded.indexOf(':');
    if (separator < 1) {
      throw unauthorized('Invalid basic authentication');
    }

    const username = decoded.slice(0, separator);
    const password = decoded.slice(separator + 1);
    const env = getEnv();

    if (!sameSecret(username, env.BasicAuth) || !sameSecret(password, env.Password)) {
      throw unauthorized('Invalid basic authentication');
    }
  }
}

export const basicAuth = new BasicAuthMiddleware().handle;
