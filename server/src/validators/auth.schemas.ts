import { z } from 'zod';

export const email = z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address'));

export const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters') // bcrypt only uses the first 72 bytes
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const username = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[a-z0-9_.]+$/, 'Username can only contain letters, numbers, underscores and dots');

export const registerSchema = z.object({
  username,
  displayName: z.string().trim().min(1).max(50).optional(),
  email,
  password,
});

export const loginSchema = z.object({
  identifier: z.string().trim().toLowerCase().min(1, 'Email or username is required'), // email OR username
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
