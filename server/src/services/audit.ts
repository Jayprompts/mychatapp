import type { Types } from 'mongoose';
import { AuditLog, type AuditAction, type AuditDoc } from '../models/AuditLog.js';
import type { UserDoc } from '../models/User.js';

type Target = { type: 'user' | 'post' | 'comment' | 'message' | 'community' | 'report'; id: Types.ObjectId | string; label?: string };

export function audit(actor: UserDoc, action: AuditAction, target: Target, details: Record<string, unknown> | null = null) {
  return AuditLog.create({
    actor: actor._id,
    actorName: `${actor.displayName} (@${actor.username})`,
    action,
    targetType: target.type,
    targetId: target.id,
    targetLabel: target.label ?? '',
    details,
  });
}

export const toAuditView = (a: AuditDoc) => ({
  id: a._id.toString(),
  actorId: a.actor.toString(),
  actorName: a.actorName,
  action: a.action,
  targetType: a.targetType,
  targetId: a.targetId.toString(),
  targetLabel: a.targetLabel,
  details: (a.details ?? null) as Record<string, unknown> | null,
  createdAt: a.createdAt,
});
