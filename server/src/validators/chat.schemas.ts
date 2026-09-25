import { z } from 'zod';
import { objectIdSchema } from '../utils/objectId.js';

export const openDirectSchema = z.object({
  userId: objectIdSchema,
});

export const sendMessageSchema = z.object({
  text: z.string().trim().min(1, 'Message cannot be empty').max(4000, 'Message is too long (max 4000 characters)'),
  clientId: z.string().trim().min(8).max(64).optional(),
});

export const messagesQuerySchema = z.object({
  before: objectIdSchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
});

export const userSearchQuerySchema = z.object({
  q: z.string().trim().min(1, 'Type a name to search').max(50),
});

export type OpenDirectInput = z.infer<typeof openDirectSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
