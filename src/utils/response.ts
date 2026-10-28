import type { Response } from 'express';
import type { PaginationMeta } from './pagination.js';

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
