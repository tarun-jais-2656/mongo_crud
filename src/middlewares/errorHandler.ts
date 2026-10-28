import type { ErrorRequestHandler, RequestHandler } from 'express';
import { Error as MongooseError } from 'mongoose';
import { ZodError } from 'zod';
import { getEnv } from '../config/env.js';
import { isAppError } from '../utils/AppError.js';
import { sendError } from '../utils/response.js';

interface MongoDuplicateError {
  code: number;
  keyValue?: Record<string, unknown>;
}

const isDuplicateKeyError = (err: unknown): err is MongoDuplicateError =>
  typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;

const isMalformedJson = (err: unknown): boolean =>
  err instanceof SyntaxError &&
  typeof err === 'object' &&
  err !== null &&
  (err as { type?: string }).type === 'entity.parse.failed';

export class ErrorHandler {

  notFound: RequestHandler = (req, res) => {
    sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
  };

  /** The ONE place errors become HTTP responses. */
  handle: ErrorRequestHandler = (err, _req, res, next) => {
    if (res.headersSent) {
      next(err);
      return;
    }

    // Deliberate, known errors.
    if (isAppError(err)) {
      sendError(res, err.statusCode, err.message);
      return;
    }

    // Zod validation errors -> 400 with the first helpful message.
    if (err instanceof ZodError) {
      const first = err.issues[0];
      const path = first?.path.join('.');
      const message = first ? `${path ? `${path}: ` : ''}${first.message}` : 'Validation failed';
      sendError(res, 400, message);
      return;
    }

    // Mongoose schema validation -> 400.
    if (err instanceof MongooseError.ValidationError) {
      const first = Object.values(err.errors)[0];
      sendError(res, 400, first?.message ?? 'Validation failed');
      return;
    }

    // Bad ObjectId that slipped through -> 400.
    if (err instanceof MongooseError.CastError) {
      sendError(res, 400, `Invalid ${err.path}`);
      return;
    }

    // Duplicate unique key (e.g. email) -> 409.
    if (isDuplicateKeyError(err)) {
      const field = err.keyValue ? Object.keys(err.keyValue)[0] : undefined;
      sendError(res, 409, field ? `${field} already exists` : 'Resource already exists');
      return;
    }

    // Broken JSON body (for example a trailing comma) -> 400, not a server crash.
    if (isMalformedJson(err)) {
      sendError(res, 400, 'Malformed JSON body');
      return;
    }

    // Anything else is an unexpected bug: log it, hide details from the client.
    console.error('Unhandled error:', err);
    const message =
      getEnv().NODE_ENV === 'production'
        ? 'Internal Server Error'
        : err instanceof Error
          ? err.message
          : 'Internal Server Error';
    sendError(res, 500, message);
  };
}

export const errorHandler = new ErrorHandler();
