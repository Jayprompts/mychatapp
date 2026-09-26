import { Link } from 'react-router';
import { Users } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useMe } from '@/features/auth/api';
import { useTypingUserIds } from '@/features/chat/liveState';
import { formatSystemEvent } from '@/features/chat/preview';
import type { Conversation } from '@/features/chat/types';
import { cn } from '@/lib/cn';
import { formatListTime } from '@/lib/time';
import { CommunityAvatar } from './CommunityAvatar';

// "My communities", per the design: icon, name, latest activity, unread count.
export function MyCommunitiesList({ communities, activeId, loading }: { communities: Conversation[]; activeId?: string; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex flex-col gap-1 px-5">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 py-2.5">
            <Skeleton className="size-[52px] shrink-0 rounded-[14px]" />
            <div className="flex-1">
              <Skeleton className="mb-2 h-3.5 w-3/5" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (communities.length === 0) {
    return (
      <EmptyState icon={Users} title="No communities yet" description="Join one from Discover, or create your own and invite your people." />
    );
  }
  return (
    <ul className="px-2">
      {communities.map((c) => (
        <Row key={c.id} conversation={c} active={c.community?.id === activeId} />
      ))}
    </ul>
  );
}

function Row({ conversation: c, active }: { conversation: Conversation; active: boolean }) {
  const { data: me } = useMe();
  const typing = useTypingUserIds(c.id).length > 0;
  const unread = c.unreadCount > 0;
  const last = c.lastMessage;
  const sender = last && c.members.find((m) => m.user.id === last.senderId)?.user;
  const prefix =
    !last || last.type === 'system' ? '' : last.senderId === me?.id ? 'You: ' : sender ? `${sender.displayName.split(' ')[0]}: ` : '';
  const text = last?.system && me ? formatSystemEvent(last.system, me.id) : last?.preview;
  const preview = typing ? 'typing…' : last ? `${prefix}${text}` : 'Say hello 👋';

  return (
    <li>
      <Link
        to={`/communities/${c.community?.id}`}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-primary',
          active ? 'bg-primary/8' : 'hover:bg-bg',
        )}
      >
        <CommunityAvatar icon={c.community?.icon ?? '🌱'} theme={c.community?.theme ?? 'grove'} size={52} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className={cn('truncate text-[15px] text-text-primary', unread ? 'font-semibold' : 'font-medium')}>{c.name}</span>
            {last && (
              <span className={cn('shrink-0 text-xs', unread ? 'font-semibold text-primary' : 'text-text-secondary')}>
                {formatListTime(last.createdAt)}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <span className={cn('truncate text-[13px]', typing ? 'font-medium text-primary' : unread ? 'font-medium text-text-primary' : 'text-text-secondary')}>
              {preview}
            </span>
            {unread && (
              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-error-solid px-1.5 text-[11px] font-bold text-white">
                {c.unreadCount > 99 ? '99+' : c.unreadCount}
              </span>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}
