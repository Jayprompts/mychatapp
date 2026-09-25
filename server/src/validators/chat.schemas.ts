import { z } from 'zod';
import { objectIdSchema } from '../utils/objectId.js';

export const openDirectSchema = z.object({
  userId: objectIdSchema,
});

const messageText = z.string().trim().min(1, 'Message cannot be empty').max(4000, 'Message is too long (max 4000 characters)');

export const sendMessageSchema = z.object({
  text: messageText,
  clientId: z.string().trim().min(8).max(64).optional(),
  replyTo: objectIdSchema.optional(),
});

export const editMessageSchema = z.object({ text: messageText });

// Any single emoji (incl. flags 🇳🇬, skin tones 🙏🏽 and combined ones like 👩🏽‍💻), nothing else.
export const reactionSchema = z.object({
  emoji: z
    .string()
    .max(16)
    .regex(
      /^(?:\p{Regional_Indicator}{2}|(\p{Extended_Pictographic}|\p{Emoji_Presentation})(\p{Emoji_Modifier}|\uFE0F|\u200D(\p{Extended_Pictographic}|\p{Emoji_Presentation})|\uFE0F)*)$/u,
      'Pick an emoji'),
});

// Multipart fields arrive as strings, so numbers/JSON are coerced here.
export const mediaMessageSchema = z.object({
  kind: z.enum(['image', 'voice']),
  clientId: z.string().trim().min(8).max(64).optional(),
  text: z.string().trim().max(4000, 'Caption is too long').optional(),
  replyTo: objectIdSchema.optional(),
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
export type EditMessageInput = z.infer<typeof editMessageSchema>;
export type ReactionInput = z.infer<typeof reactionSchema>;

const groupName = z.string().trim().min(1, 'Give the group a name').max(80, 'Group name is too long (max 80)');
const groupDescription = z.string().trim().max(300, 'Description is too long (max 300)');
const userIds = z
  .array(objectIdSchema)
  .min(1, 'Pick at least one person')
  .max(99, 'Too many people at once')
  .transform((ids) => [...new Set(ids)]);

export const createGroupSchema = z.object({
  name: groupName,
  description: groupDescription.optional(),
  memberIds: userIds,
});

export const updateGroupSchema = z
  .object({ name: groupName.optional(), description: groupDescription.optional() })
  .refine((d) => d.name !== undefined || d.description !== undefined, 'Nothing to update');

export const addMembersSchema = z.object({ userIds });

export const setRoleSchema = z.object({ role: z.enum(['admin', 'member']) });

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type AddMembersInput = z.infer<typeof addMembersSchema>;
export type SetRoleInput = z.infer<typeof setRoleSchema>;
