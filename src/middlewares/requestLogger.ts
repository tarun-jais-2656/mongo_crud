import type { RequestHandler } from 'express';

/**
 * Logs one line per request after the response is sent.
 * Method, path, status, and duration only — never headers or the body.
 */
export class RequestLogger {
  handle: RequestHandler = (req, res, next) => {
    const started = process.hrtime.bigint();

    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - started) / 1_000_000;
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(1)}ms`);
    });

    next();
  };
}

export const requestLogger = new RequestLogger().handle;
