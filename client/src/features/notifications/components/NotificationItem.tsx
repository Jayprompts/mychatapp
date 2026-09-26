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
  post_like: { icon: Heart, className: 'bg-[#FFECEC] text-error' },
  comment_like: { icon: Heart, className: 'bg-[#FFECEC] text-error' },
  post_comment: { icon: MessageCircle, className: 'bg-[#E8F6EC] text-success' },
  comment_reply: { icon: MessageCircle, className: 'bg-[#E8F6EC] text-success' },
  mention: { icon: AtSign, className: 'bg-[#F6E8FC] text-[#B620E0]' },
  community_join: { icon: Users, className: 'bg-[#FFF6E0] text-[#B68A00]' },
  community_request: { icon: Users, className: 'bg-[#FFF6E0] text-[#B68A00]' },
  request_approved: { icon: Users, className: 'bg-[#FFF6E0] text-[#B68A00]' },
  group_added: { icon: UserPlus, className: 'bg-[#EEF3FF] text-primary' },
  moderation: { icon: ShieldAlert, className: 'bg-[#FFF6E0] text-[#B68A00]' },
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
        <span className={cn('absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full ring-2 ring-card', className)}>
          <Icon size={11} strokeWidth={2.4} />
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
