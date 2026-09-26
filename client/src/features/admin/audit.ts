import type { AuditEntry } from './types';
import { ROLE_LABELS } from './types';

// "suspended @john — Spamming" · "changed @ana's role: User → Content Moderator"
export function describeAudit(e: AuditEntry): string {
  const t = e.targetLabel || e.targetType;
  const reason = typeof e.details?.reason === 'string' && e.details.reason ? ` — ${e.details.reason}` : '';
  switch (e.action) {
    case 'user.suspend':
      return `suspended ${t}${reason}`;
    case 'user.ban':
      return `banned ${t}${reason}`;
    case 'user.activate':
      return `reactivated ${t}`;
    case 'user.delete':
      return `deleted the account ${t}`;
    case 'user.warn':
      return `warned ${t}${reason}`;
    case 'user.role': {
      const from = ROLE_LABELS[e.details?.from as keyof typeof ROLE_LABELS] ?? String(e.details?.from);
      const to = ROLE_LABELS[e.details?.to as keyof typeof ROLE_LABELS] ?? String(e.details?.to);
      return `changed ${t}'s role: ${from} → ${to}`;
    }
    case 'post.feature':
      return `featured the post “${t}”`;
    case 'post.unfeature':
      return `unfeatured the post “${t}”`;
    case 'post.unpublish':
      return `unpublished the post “${t}”${reason}`;
    case 'post.delete':
      return `deleted the post “${t}”${reason}`;
    case 'comment.delete':
      return `deleted a comment${t ? ` by ${t}` : ''}${reason}`;
    case 'message.delete':
      return `removed a message${t ? ` by ${t}` : ''}${reason}`;
    case 'community.feature':
      return `featured the community ${t}`;
    case 'community.unfeature':
      return `unfeatured the community ${t}`;
    case 'community.delete':
      return `deleted the community ${t}${reason}`;
    case 'community.member_role':
      return `changed a member's role in ${t}`;
    case 'community.member_remove':
      return `removed a member from ${t}`;
    case 'report.dismiss':
      return `dismissed a report about ${t}`;
    default:
      return `${e.action} ${t}`;
  }
}

export const AUDIT_ACTION_OPTIONS = [
  { value: 'user.suspend', label: 'Suspended' },
  { value: 'user.ban', label: 'Banned' },
  { value: 'user.activate', label: 'Reactivated' },
  { value: 'user.delete', label: 'Deleted account' },
  { value: 'user.role', label: 'Role changed' },
] as const;
