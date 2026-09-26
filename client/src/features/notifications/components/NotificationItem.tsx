import { Link } from 'react-router';
import { AtSign, Heart, MessageCircle, ShieldAlert, UserPlus, Users, type LucideIcon } from 'lucide-react';
import { LogoMark } from '@/components/ui/Logo';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/cn';
import { formatAgo } from '@/lib/time';
import { useMarkRead } from '../api';
import { describe } from '../format';
import type { AppNotification, NotificationType } from '../types';

const BADGES: Record<NotificationType, { icon: LucideIcon; className: string }> = {
  post_like: { icon: Heart, className: 'bg-error/15 text-error' },
  comment_like: { icon: Heart, className: 'bg-error/15 text-error' },
  post_comment: { icon: MessageCircle, className: 'bg-success/12 text-success' },
  comment_reply: { icon: MessageCircle, className: 'bg-success/12 text-success' },
  mention: { icon: AtSign, className: 'bg-accent/12 text-accent' },
  community_join: { icon: Users, className: 'bg-warning/15 text-warning-ink' },
  community_request: { icon: Users, className: 'bg-warning/15 text-warning-ink' },
  request_approved: { icon: Users, className: 'bg-warning/15 text-warning-ink' },
  group_added: { icon: UserPlus, className: 'bg-primary/15 text-primary' },
  moderation: { icon: ShieldAlert, className: 'bg-warning/15 text-warning-ink' },
};

// One row, per the design: avatar with a type badge, "Bob and 2 others liked your post…", time, unread dot.
export function NotificationItem({ n, onOpen }: { n: AppNotification; onOpen?: () => void }) {
  const markRead = useMarkRead();
  const { who, action, quote, href } = describe(n);
  const { icon: Icon, className } = BADGES[n.type];
  const actor = n.actors[0];

  return (
    <Link
      to={href}
      onClick={() => {
        if (!n.read) markRead.mutate(n.id);
        onOpen?.();
      }}
      className={cn('flex items-start gap-3 border-b border-border px-4 py-3 transition-colors last:border-0 hover:bg-bg', !n.read && 'bg-primary/3')}
    >
      <span className="relative shrink-0">
        {n.type === 'moderation' ? <LogoMark size={40} /> : <Avatar name={actor?.displayName ?? '?'} src={actor?.avatarUrl ?? null} size={40} />}
        {/* solid base under the tint, so the avatar never shows through (matters on dark) */}
        <span className="absolute -right-1 -bottom-1 size-5 rounded-full bg-card ring-2 ring-card">
          <span className={cn('flex size-full items-center justify-center rounded-full', className)}>
            <Icon size={11} strokeWidth={2.4} />
          </span>
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-[13px] leading-snug text-text-secondary">
          <strong className="font-bold text-text-primary">{who}</strong> {action}
        </span>
        {quote && <span className="mt-0.5 block truncate text-[13px] text-text-primary">“{quote}”</span>}
        <span className={cn('mt-0.5 block text-[11px]', n.read ? 'text-text-secondary' : 'font-semibold text-primary')}>{formatAgo(n.updatedAt)}</span>
      </span>
      {!n.read && <span className="gradient-brand mt-1.5 size-2 shrink-0 rounded-full" aria-label="Unread" />}
    </Link>
  );
}
