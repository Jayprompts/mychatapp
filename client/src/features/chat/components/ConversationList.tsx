import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { MessageCircle, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormAlert } from '@/components/ui/FormAlert';
import { Skeleton } from '@/components/ui/Skeleton';
import { useMe } from '@/features/auth/api';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatListTime } from '@/lib/time';
import { useConversations } from '../api';
import { useTypingUserIds } from '../liveState';
import { formatSystemEvent } from '../preview';
import type { Conversation } from '../types';
import { ConversationAvatar } from './ConversationAvatar';
import { NewChatDialog } from './NewChatDialog';

export function ConversationList({ activeId }: { activeId?: string }) {
  const { data: me } = useMe();
  const conversations = useConversations();
  const [filter, setFilter] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return conversations.data ?? [];
    return (conversations.data ?? []).filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.members.some((m) => m.user.id !== me?.id && m.user.username.includes(q)),
    );
  }, [conversations.data, filter, me?.id]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between px-4">
        <h1 className="text-[22px] font-bold tracking-tight text-text-primary">Chats</h1>
      </header>

      <div className="px-4 pb-3">
        <label className="flex items-center gap-2.5 rounded-full bg-surface-2 px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/30">
          <Search size={16} className="shrink-0 text-text-secondary" aria-hidden />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search chats"
            aria-label="Search chats"
            className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-24">
        {conversations.isPending ? (
          <ListSkeleton />
        ) : conversations.isError ? (
          <div className="flex flex-col gap-3 p-4">
            <FormAlert>{errorMessage(conversations.error)}</FormAlert>
            <Button variant="secondary" size="sm" onClick={() => conversations.refetch()}>
              Try again
            </Button>
          </div>
        ) : conversations.data.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No conversations yet"
            description="Start a conversation and your messages will appear here."
            action={<Button onClick={() => setNewChatOpen(true)}>New message</Button>}
          />
        ) : visible.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-text-secondary">No chats match "{filter.trim()}".</p>
        ) : (
          <ul className="px-2">
            {visible.map((c) => (
              <ConversationRow key={c.id} conversation={c} active={c.id === activeId} />
            ))}
          </ul>
        )}
      </div>

      {/* Floating "new message" button, per the design */}
      <button
        type="button"
        onClick={() => setNewChatOpen(true)}
        aria-label="New message"
        className="gradient-brand absolute right-4 bottom-4 flex size-13 items-center justify-center rounded-full text-white shadow-brand transition-transform hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <Plus size={24} strokeWidth={2.2} />
      </button>

      <NewChatDialog open={newChatOpen} onClose={() => setNewChatOpen(false)} />
    </div>
  );
}

function ConversationRow({ conversation: c, active }: { conversation: Conversation; active: boolean }) {
  const { data: me } = useMe();
  const typing = useTypingUserIds(c.id).length > 0;
  const unread = c.unreadCount > 0;

  // "You: …" for my messages; "Ana: …" for others in groups; system lines as they are.
  const last = c.lastMessage;
  const sender = last && c.members.find((m) => m.user.id === last.senderId)?.user;
  const prefix =
    !last || last.type === 'system'
      ? ''
      : last.senderId === me?.id
        ? 'You: '
        : c.type === 'group' && sender
          ? `${sender.displayName.split(' ')[0]}: `
          : '';
  const lastText = last?.system && me ? formatSystemEvent(last.system, me.id) : last?.preview;
  const preview = typing ? 'typing…' : last ? `${prefix}${lastText}` : 'Say hello 👋';

  return (
    <li>
      <Link
        to={`/chats/${c.id}`}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-primary',
          active ? 'bg-primary/8' : 'hover:bg-bg',
        )}
      >
        <ConversationAvatar conversation={c} myId={me?.id} size={52} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className={cn('truncate text-[15px] text-text-primary', unread ? 'font-semibold' : 'font-medium')}>
              {c.name}
            </span>
            {c.lastMessage && (
              <span className={cn('shrink-0 text-xs', unread ? 'font-semibold text-primary' : 'text-text-secondary')}>
                {formatListTime(c.lastMessage.createdAt)}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <span
              className={cn(
                'truncate text-[13px]',
                typing ? 'font-medium text-primary' : unread ? 'font-medium text-text-primary' : 'text-text-secondary',
              )}
            >
              {preview}
            </span>
            {unread && (
              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-error px-1.5 text-[11px] font-bold text-white">
                {c.unreadCount > 99 ? '99+' : c.unreadCount}
              </span>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-1 px-5">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 py-2.5">
          <Skeleton className="size-[52px] shrink-0 rounded-full" />
          <div className="flex-1">
            <Skeleton className="mb-2 h-3.5 w-3/5" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
