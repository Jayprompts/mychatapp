import { z } from 'zod';
import { AUDIT_ACTIONS } from '../models/AuditLog.js';
import { ROLES } from '../models/User.js';
import { objectIdSchema } from '../utils/objectId.js';

const page = z.coerce.number().int().min(1).max(10_000).default(1);
const reason = z.string().trim().max(200, 'Keep the reason under 200 characters').optional();

export const usersQuerySchema = z.object({
  q: z.string().trim().max(60).optional(),
  role: z.enum(ROLES).optional(),
  status: z.enum(['active', 'suspended', 'banned']).optional(),
  page,
});

export const setStatusSchema = z.object({ status: z.enum(['active', 'suspended', 'banned']), reason });
export const setRoleSchema = z.object({ role: z.enum(ROLES) });
export const bulkUsersSchema = z.object({
  ids: z.array(objectIdSchema).min(1, 'Pick at least one person').max(100),
  action: z.enum(['suspend', 'ban', 'activate', 'delete']),
  reason,
});

export const auditQuerySchema = z.object({
  actor: objectIdSchema.optional(),
  action: z.enum(AUDIT_ACTIONS).optional(),
  page,
});

export type SetStatusInput = z.infer<typeof setStatusSchema>;
export type BulkUsersInput = z.infer<typeof bulkUsersSchema>;

const note = z.string().trim().max(300, 'Keep the note under 300 characters').optional();

export const reportsQuerySchema = z.object({
  status: z.enum(['open', 'resolved', 'dismissed']).default('open'),
  type: z.enum(['post', 'comment', 'message', 'user']).optional(),
  page,
});
export const resolveReportSchema = z.object({ action: z.enum(['dismiss', 'remove', 'warn', 'ban']), note });

export const adminPostsQuerySchema = z.object({ q: z.string().trim().max(60).optional(), featured: z.enum(['true']).optional(), page });
export const postFlagsSchema = z.object({ featured: z.boolean() });
export const withReasonSchema = z.object({ reason: note });
export const bulkPostsSchema = z.object({
  ids: z.array(objectIdSchema).min(1, 'Pick at least one post').max(100),
  action: z.enum(['feature', 'unfeature', 'unpublish', 'delete']),
  reason: note,
});

export const adminCommunitiesQuerySchema = z.object({ q: z.string().trim().max(60).optional(), featured: z.enum(['true']).optional(), page });
export const communityFlagsSchema = z.object({ featured: z.boolean() });
export const memberRoleSchema = z.object({ role: z.enum(['owner', 'admin', 'member']) });

export type ResolveReportInput = z.infer<typeof resolveReportSchema>;
export type BulkPostsInput = z.infer<typeof bulkPostsSchema>;
