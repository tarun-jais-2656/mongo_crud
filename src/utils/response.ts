import type { Response } from 'express';
import type { PaginationMeta } from './pagination.js';
import type { CacheState } from './cache.js';

/** Header only. The JSON body is the same on a hit and a miss. */
export const setCacheHeader = (res: Response, state: CacheState): void => {
  res.setHeader('X-Cache', state);
};

export const sendSuccess = (res: Response, data: unknown, status = 200): void => {
  if (status === 204) {
    res.status(204).end();
    return;
  }
  res.status(status).json({ success: true, statusCode: status, data });
};

export const sendPaginated = (
  res: Response,
  data: unknown[],
  pagination: PaginationMeta,
  status = 200,
): void => {
  res.status(status).json({ success: true, statusCode: status, data, pagination });
};

export const sendError = (res: Response, status: number, message: string): void => {
  res.status(status).json({ success: false, statusCode: status, message });
};
