import type { Request } from 'express';
import { getEnv } from '../config/env.js';
import { tooManyRequests } from '../utils/AppError.js';

interface Attempt {
  count: number;
  firstAt: number;
}

/**
 * Very small in-memory throttle for failed logins (bonus). Keyed by IP + email
 * so one attacker cannot lock out everyone. A real deployment would use Redis;
 * for this assignment an in-process Map is enough.
 */
export class LoginThrottle {
  private readonly attempts = new Map<string, Attempt>();

  private keyFor(req: Request, email: string): string {
    return `${req.ip ?? 'unknown'}:${email}`;
  }

  private windowMs(): number {
    return getEnv().LOGIN_WINDOW_MINUTES * 60_000;
  }

  /** Throws 429 if this IP+email has too many recent failures. */
  assertAllowed(req: Request, email: string): void {
    const key = this.keyFor(req, email);
    const entry = this.attempts.get(key);
    if (!entry) return;

    // Window elapsed -> forget the old attempts.
    if (Date.now() - entry.firstAt > this.windowMs()) {
      this.attempts.delete(key);
      return;
    }

    if (entry.count >= getEnv().LOGIN_MAX_ATTEMPTS) {
      const minutes = getEnv().LOGIN_WINDOW_MINUTES;
      throw tooManyRequests(`Too many failed login attempts. Try again in up to ${minutes} minutes.`);
    }
  }

  recordFailure(req: Request, email: string): void {
    const key = this.keyFor(req, email);
    const entry = this.attempts.get(key);
    if (!entry || Date.now() - entry.firstAt > this.windowMs()) {
      this.attempts.set(key, { count: 1, firstAt: Date.now() });
      return;
    }
    entry.count += 1;
  }

  clear(req: Request, email: string): void {
    this.attempts.delete(this.keyFor(req, email));
  }
}

export const loginThrottle = new LoginThrottle();
