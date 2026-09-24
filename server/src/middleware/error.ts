import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { AppError } from '../utils/AppError.js';
import { isProd } from '../config/env.js';

export const notFound: RequestHandler = (req, _res, next) => {
  next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// Turns known library errors into clean AppErrors so clients get a useful 4xx instead of a 500.
function normalize(err: unknown): unknown {
  // Malformed JSON body sent by the client
  if (typeof err === 'object' && err !== null && 'type' in err && err.type === 'entity.parse.failed') {
    return new AppError(400, 'Invalid JSON body');
  }

  // MongoDB unique-index violation, e.g. two users registering the same email at the same moment
  if (typeof err === 'object' && err !== null && 'code' in err && err.code === 11000) {
    const keyValue = 'keyValue' in err && typeof err.keyValue === 'object' && err.keyValue ? err.keyValue : {};
    const field = Object.keys(keyValue)[0] ?? 'value';
    return new AppError(409, `That ${field} is already taken`, { [field]: [`That ${field} is already taken`] });
  }

  // Invalid ObjectId in a URL param, e.g. /api/users/not-an-id
  if (err instanceof mongoose.Error.CastError) {
    return new AppError(400, `Invalid ${err.path}`);
  }

  // Schema validation that slipped past zod
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, [v.message]]));
    return new AppError(400, 'Validation failed', details);
  }

  return err;
}

export const errorHandler: ErrorRequestHandler = (rawErr, _req, res, _next) => {
  const err = normalize(rawErr);
  const isAppError = err instanceof AppError;
  const status = isAppError ? err.statusCode : 500;

  if (status >= 500) console.error(err);

  res.status(status).json({
    success: false,
    error: {
      message: isAppError ? err.message : 'Something went wrong',
      ...(isAppError && err.details ? { details: err.details } : {}),
      ...(!isProd && !isAppError && err instanceof Error ? { stack: err.stack } : {}),
    },
  });
};
