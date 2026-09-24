import type { RequestHandler } from 'express';
import { z } from 'zod';
import { AppError } from '../utils/AppError.js';

// Validates req.body against a zod schema and replaces it with the cleaned (trimmed, lowercased…) data.
export const validate =
  (schema: z.ZodType): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      throw new AppError(400, 'Validation failed', z.flattenError(result.error).fieldErrors);
    }
    req.body = result.data;
    next();
  };
