import { z } from 'zod';
import { REPORT_REASONS, REPORT_TARGETS } from '../models/Report.js';
import { objectIdSchema } from '../utils/objectId.js';

export const createReportSchema = z
  .object({
    targetType: z.enum(REPORT_TARGETS),
    targetId: objectIdSchema,
    reason: z.enum(REPORT_REASONS),
    details: z.string().trim().max(500, 'Keep it under 500 characters').optional(),
  })
  .refine((r) => r.reason !== 'Other' || (r.details && r.details.length >= 3), {
    message: 'Tell us a little about the problem',
    path: ['details'],
  });

export type CreateReportInput = z.infer<typeof createReportSchema>;
