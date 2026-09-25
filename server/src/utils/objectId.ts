import mongoose from 'mongoose';
import { z } from 'zod';
import { AppError } from './AppError.js';

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

// For URL params: /api/conversations/:id -> validated id string, or 400.
export function parseObjectId(value: unknown, name = 'id'): string {
  if (typeof value !== 'string' || !mongoose.isValidObjectId(value) || !/^[a-f\d]{24}$/i.test(value)) {
    throw new AppError(400, `Invalid ${name}`);
  }
  return value;
}
