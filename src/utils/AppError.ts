export interface AppError extends Error {
  isAppError: true;
  statusCode: number;
}

export const createError = (statusCode: number, message: string): AppError =>
  Object.assign(new Error(message), { isAppError: true as const, statusCode });

export const isAppError = (err: unknown): err is AppError =>
  err instanceof Error && (err as Partial<AppError>).isAppError === true;

export const badRequest = (message = 'Bad request') => createError(400, message);
export const unauthorized = (message = 'Authentication required') => createError(401, message);
export const forbidden = (message = 'Forbidden') => createError(403, message);
export const notFound = (message = 'Resource not found') => createError(404, message);
export const conflict = (message = 'Resource already exists') => createError(409, message);
export const tooManyRequests = (message = 'Too many requests') => createError(429, message);
