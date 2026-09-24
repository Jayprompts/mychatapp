import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from '../utils/AppError.js';
import { isProd } from '../config/env.js';

export const notFound: RequestHandler = (req, _res, next) => {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // Malformed JSON body sent by the client
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ success: false, error: { message: 'Invalid JSON body' } });
    return;
  }

  const isAppError = err instanceof AppError;
  const status = isAppError ? err.statusCode : 500;

  if (status >= 500) console.error(err);

  res.status(status).json({
    success: false,
    error: {
      message: isAppError ? err.message : 'Something went wrong',
      ...(isAppError && err.details ? { details: err.details } : {}),
      ...(!isProd && !isAppError ? { stack: err.stack } : {}),
    },
  });
};