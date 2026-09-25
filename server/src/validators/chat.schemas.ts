import { z } from 'zod';
import { objectIdSchema } from '../utils/objectId.js';

export const openDirectSchema = z.object({
  userId: objectIdSchema,
});

export const sendMessageSchema = z.object({
  text: z.string().trim().min(1, 'Message cannot be empty').max(4000, 'Message is too long (max 4000 characters)'),
  clientId: z.string().trim().min(8).max(64).optional(),
});

// Multipart fields arrive as strings, so numbers/JSON are coerced here.
export const mediaMessageSchema = z.object({
  kind: z.enum(['image', 'voice']),
  clientId: z.string().trim().min(8).max(64).optional(),
  text: z.string().trim().max(4000, 'Caption is too long').optional(),
  durationMs: z.coerce.number().int().min(300, 'Recording is too short').max(10 * 60 * 1000).optional(),
  waveform: z
    .string()
    .optional()
    .transform((raw, ctx) => {
      if (!raw) return undefined;
      try {
        const bars = z.array(z.number().min(0).max(1)).max(64).parse(JSON.parse(raw));
        return bars.map((b) => Math.round(b * 100) / 100);
      } catch {
        ctx.addIssue({ code: 'custom', message: 'Invalid waveform' });
        return z.NEVER;
      }
    }),
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
