import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Info, MessageCircleOff } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { buttonClasses } from '@/components/ui/buttonClasses';
import { useMe } from '@/features/auth/api';
import { cn } from '@/lib/cn';
import { formatLastSeen } from '@/lib/time';
import { useSetBlocked } from '@/features/profile/api';
import { errorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useConversation, useMarkRead } from '../api';
import { usePresence, useTypingUserIds } from '../liveState';
import type { Conversation, Message } from '../types';
import { ChatInfoPanel } from './ChatInfoPanel';
import { Composer } from './Composer';
import { ConversationAvatar } from './ConversationAvatar';
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
          description="It may have been deleted, or you're no longer a member."
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

  const [infoOpen, setInfoOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editing, setEditing] = useState<Message | null>(null);
  const nameOf = (userId: string) =>
    userId === myId ? 'yourself' : (conversation.members.find((m) => m.user.id === userId)?.user.displayName ?? 'message');

  return (
    <div className="relative flex min-h-0 flex-1">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-card">
        <ChatHeader
          conversation={conversation}
          myId={myId}
          typingUserIds={typingUserIds}
          infoOpen={infoOpen}
          onToggleInfo={() => setInfoOpen((o) => !o)}
        />
        <MessageList
          conversation={conversation}
          myId={myId}
          typingUserIds={typingUserIds}
          onReply={(m) => {
            setEditing(null);
            setReplyTo(m);
          }}
          onEdit={(m) => {
            setReplyTo(null);
            setEditing(m);
          }}
        />
        {conversation.blocked ? (
          <BlockedBanner conversation={conversation} myId={myId} />
        ) : (
          <Composer
            conversationId={conversation.id}
            replyTo={replyTo}
            replyToName={replyTo ? nameOf(replyTo.senderId) : undefined}
            onCancelReply={() => setReplyTo(null)}
            editing={editing}
            onDoneEditing={() => setEditing(null)}
          />
        )}
      </div>

      {/* Chat info: side column on large screens, full-screen sheet below that */}
      {infoOpen && (
        <div className="absolute inset-0 z-20 flex flex-col bg-card lg:static lg:w-80 lg:shrink-0 lg:border-l lg:border-border">
          <ChatInfoPanel conversation={conversation} myId={myId} onClose={() => setInfoOpen(false)} />
        </div>
      )}
    </div>
  );
}

function typingText(names: string[]): string {
  if (names.length === 1) return `${names[0]} is typing…`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`;
  return `${names.length} people are typing…`;
}

type HeaderProps = {
  conversation: Conversation;
  myId: string;
  typingUserIds: string[];
  infoOpen: boolean;
  onToggleInfo: () => void;
};

function ChatHeader({ conversation, myId, typingUserIds, infoOpen, onToggleInfo }: HeaderProps) {
  const isGroup = conversation.type !== 'direct'; // groups + communities
  const other = !isGroup ? conversation.members.find((m) => m.user.id !== myId)?.user : undefined;
  const presence = usePresence(other);

  const typingNames = typingUserIds.map(
    (id) => conversation.members.find((m) => m.user.id === id)?.user.displayName.split(' ')[0] ?? 'Someone',
  );
  const subtitle = typingNames.length
    ? isGroup
      ? typingText(typingNames)
      : 'typing…'
    : conversation.type !== 'direct'
      ? `${conversation.members.length.toLocaleString()} ${conversation.members.length === 1 ? 'member' : 'members'}`
      : formatLastSeen(presence.online, presence.lastSeenAt);

  return (
    <header className="flex h-16 shrink-0 items-center gap-1 border-b border-border bg-card px-2 sm:px-4">
      <h1 className="sr-only">{conversation.name}</h1>
      <Link
        to={conversation.type === 'community' ? '/communities' : '/chats'}
        aria-label={conversation.type === 'community' ? 'Back to communities' : 'Back to chats'}
        className="flex size-10 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/8 md:hidden"
      >
        <ArrowLeft size={22} />
      </Link>
      {/* Tapping the name/avatar opens chat info (per the design) */}
      <button
        type="button"
        onClick={onToggleInfo}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1 py-1 text-left transition-colors hover:bg-bg focus-visible:outline-2 focus-visible:outline-primary"
      >
        <ConversationAvatar conversation={conversation} myId={myId} size={40} />
        <span className="min-w-0">
          <span className="block truncate text-base font-semibold text-text-primary">{conversation.name}</span>
          <span className={cn('block truncate text-xs', typingNames.length ? 'font-medium text-primary' : 'text-text-secondary')}>
            {subtitle}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={onToggleInfo}
        aria-label="Chat info"
        aria-pressed={infoOpen}
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-full transition-colors',
          infoOpen ? 'bg-primary/10 text-primary' : 'text-primary hover:bg-primary/8',
        )}
      >
        <Info size={21} />
      </button>
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

// A blocked 1-on-1 chat keeps its history but can't take new messages.
function BlockedBanner({ conversation, myId }: { conversation: Conversation; myId: string }) {
  const unblock = useSetBlocked();
  const other = conversation.members.find((m) => m.user.id !== myId)?.user;
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-center gap-x-3 gap-y-2 border-t border-border bg-card px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-center text-sm text-text-secondary">
      {conversation.blocked === 'byMe' ? (
        <>
          <span>You blocked {other?.displayName ?? 'this person'}.</span>
          <button
            type="button"
            disabled={unblock.isPending}
            onClick={() => other && unblock.mutate({ userId: other.id, blocked: false }, { onError: (e) => toast(errorMessage(e), 'error') })}
            className="font-semibold text-primary hover:underline"
          >
            Unblock
          </button>
        </>
      ) : (
        <span>You can't reply to this conversation.</span>
      )}
    </div>
  );
}
