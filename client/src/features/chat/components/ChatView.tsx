import { useEffect } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, MessageCircleOff } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { buttonClasses } from '@/components/ui/buttonClasses';
import { useMe } from '@/features/auth/api';
import { cn } from '@/lib/cn';
import { formatLastSeen } from '@/lib/time';
import { useConversation, useMarkRead } from '../api';
import { usePresence, useTypingUserIds } from '../liveState';
import type { Conversation } from '../types';
import { Composer } from './Composer';
import { MessageList } from './MessageList';

export function ChatView({ conversationId }: { conversationId: string }) {
  const { data: me } = useMe();
  const { conversation, isLoading } = useConversation(conversationId);

  if (isLoading) return <ChatSkeleton />;
  if (!conversation || !me) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          icon={MessageCircleOff}
          title="Conversation not found"
          description="It may have been deleted, or you're not a member."
          action={
            <Link to="/chats" className={buttonClasses({ variant: 'secondary' })}>
              Back to chats
            </Link>
          }
        />
      </div>
    );
  }

  return <ChatViewLoaded conversation={conversation} myId={me.id} />;
}

function ChatViewLoaded({ conversation, myId }: { conversation: Conversation; myId: string }) {
  const typingUserIds = useTypingUserIds(conversation.id);
  const markRead = useMarkRead(conversation.id);

  // Clear my unread badge whenever this chat is open and visible (incl. when new messages arrive).
  const { mutate: markAsRead, isPending: marking } = markRead;
  useEffect(() => {
    const markIfVisible = () => {
      if (conversation.unreadCount > 0 && document.visibilityState === 'visible' && !marking) markAsRead();
    };
    markIfVisible();
    document.addEventListener('visibilitychange', markIfVisible);
    return () => document.removeEventListener('visibilitychange', markIfVisible);
  }, [conversation.unreadCount, marking, markAsRead]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-card">
      <ChatHeader conversation={conversation} myId={myId} typing={typingUserIds.length > 0} />
      <MessageList conversation={conversation} myId={myId} typingUserIds={typingUserIds} />
      <Composer conversationId={conversation.id} />
    </div>
  );
}

function ChatHeader({ conversation, myId, typing }: { conversation: Conversation; myId: string; typing: boolean }) {
  const other = conversation.type === 'direct' ? conversation.members.find((m) => m.user.id !== myId)?.user : undefined;
  const presence = usePresence(other);

  const subtitle =
    conversation.type === 'group'
      ? `${conversation.members.length} members`
      : formatLastSeen(presence.online, presence.lastSeenAt);

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-2 sm:px-4">
      <Link
        to="/chats"
        aria-label="Back to chats"
        className="flex size-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/8 md:hidden"
      >
        <ArrowLeft size={22} />
      </Link>
      <Avatar
        name={conversation.name}
        src={conversation.avatarUrl}
        size={40}
        status={presence.online ? 'online' : undefined}
      />
      <div className="min-w-0">
        <h2 className="truncate text-base font-semibold text-text-primary">{conversation.name}</h2>
        <p className={cn('truncate text-xs', typing ? 'font-medium text-primary' : 'text-text-secondary')}>
          {typing ? 'typing…' : subtitle}
        </p>
      </div>
    </header>
  );
}

function ChatSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-card">
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <Skeleton className="size-10 rounded-full" />
        <div>
          <Skeleton className="mb-1.5 h-3.5 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="flex-1" />
    </div>
  );
}
