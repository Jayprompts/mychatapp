import { Fragment, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDayLabel, isSameDay } from '@/lib/time';
import { useMessages, useSendMessage } from '../api';
import type { Conversation, Message } from '../types';
import { MessageBubble, type BubblePosition } from './MessageBubble';
import { TypingBubble } from './TypingBubble';

const GROUP_GAP_MS = 5 * 60 * 1000; // messages within 5 min from the same person form one run
const NEAR_BOTTOM_PX = 150;

type Props = { conversation: Conversation; myId: string; typingUserIds: string[] };

export function MessageList({ conversation, myId, typingUserIds }: Props) {
  const query = useMessages(conversation.id);
  const send = useSendMessage(conversation.id);
  const scrollRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);

  // pages[0] is the newest page — flip so the list reads oldest -> newest.
  const messages = useMemo(
    () => (query.data ? [...query.data.pages].reverse().flatMap((p) => p.messages) : []),
    [query.data],
  );

  const members = useMemo(() => new Map(conversation.members.map((m) => [m.user.id, m])), [conversation.members]);
  const isGroup = conversation.type === 'group';

  // "Seen" = every other member has read up to my latest confirmed message.
  const lastMine = [...messages].reverse().find((m) => m.senderId === myId && !m.status);
  const receipt: 'sent' | 'seen' | undefined = lastMine
    ? conversation.members
        .filter((m) => m.user.id !== myId)
        .every((m) => new Date(m.lastReadAt).getTime() >= new Date(lastMine.createdAt).getTime())
      ? 'seen'
      : 'sent'
    : undefined;

  // ── Scroll behaviour ─────────────────────────────────────────────
  // distance from the bottom of the content, updated on every scroll
  const fromBottom = useRef(0);
  const edges = useRef<{ first?: string; last?: string }>({});

  const onScroll = () => {
    const el = scrollRef.current;
    if (el) fromBottom.current = el.scrollHeight - el.scrollTop;
  };

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || messages.length === 0) return;
    const first = messages[0].id;
    const last = messages[messages.length - 1];
    const prev = edges.current;

    if (!prev.last) {
      el.scrollTop = el.scrollHeight; // first render: start at the newest message
    } else if (prev.first !== first && prev.last === last.id) {
      el.scrollTop = el.scrollHeight - fromBottom.current; // older page prepended: keep the view still
    } else if (prev.last !== last.id) {
      const wasNearBottom = fromBottom.current - el.clientHeight < NEAR_BOTTOM_PX;
      if (wasNearBottom || last.senderId === myId) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }

    edges.current = { first, last: last.id };
    fromBottom.current = el.scrollHeight - el.scrollTop;
  }, [messages, myId]);

  // Keep the typing bubble visible if we're already at the bottom.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && typingUserIds.length > 0 && fromBottom.current - el.clientHeight < NEAR_BOTTOM_PX) {
      el.scrollTop = el.scrollHeight;
    }
  }, [typingUserIds.length]);

  // Load older messages when the top of the list scrolls into view.
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    const root = scrollRef.current;
    if (!sentinel || !root || !hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { root, rootMargin: '200px 0px 0px 0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (query.isPending) return <HistorySkeleton />;

  if (query.isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-text-secondary">Couldn't load messages.</p>
        <Button variant="secondary" size="sm" onClick={() => query.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const position = (i: number): BubblePosition => {
    const m = messages[i];
    const joins = (a?: Message, b?: Message) =>
      !!a &&
      !!b &&
      a.senderId === b.senderId &&
      isSameDay(a.createdAt, b.createdAt) &&
      Math.abs(new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) < GROUP_GAP_MS;
    return { first: !joins(messages[i - 1], m), last: !joins(m, messages[i + 1]) };
  };

  return (
    <div ref={scrollRef} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5">
      <div ref={topSentinelRef} />
      {isFetchingNextPage && (
        <div className="flex justify-center py-2 text-text-secondary">
          <LoaderCircle size={18} className="animate-spin" aria-label="Loading older messages" />
        </div>
      )}
      {!hasNextPage && messages.length > 0 && (
        <p className="py-4 text-center text-xs text-text-tertiary">This is the beginning of your conversation.</p>
      )}

      {messages.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
          <p className="text-[15px] font-semibold text-text-primary">No messages yet</p>
          <p className="text-sm text-text-secondary">Say hello to {conversation.name} 👋</p>
        </div>
      ) : (
        messages.map((m, i) => (
          <Fragment key={m.clientId ?? m.id}>
            {(i === 0 || !isSameDay(messages[i - 1].createdAt, m.createdAt)) && <DaySeparator iso={m.createdAt} />}
            <MessageBubble
              message={m}
              mine={m.senderId === myId}
              sender={members.get(m.senderId)?.user}
              showSenderName={isGroup}
              position={position(i)}
              receipt={m.id === lastMine?.id ? receipt : undefined}
              onRetry={(failed) => void send(failed.text, failed)}
            />
          </Fragment>
        ))
      )}

      {typingUserIds.length > 0 && <TypingBubble users={typingUserIds.map((id) => members.get(id)?.user)} />}
    </div>
  );
}

function DaySeparator({ iso }: { iso: string }) {
  return (
    <div className="my-4 flex items-center gap-3" role="separator">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs font-medium text-text-secondary">{formatDayLabel(iso)}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="flex flex-1 flex-col justify-end gap-3 p-5">
      {['w-2/5', 'w-1/2', 'w-1/3', 'w-3/5', 'w-2/5'].map((width, i) => (
        <Skeleton key={i} className={`h-9 rounded-[18px] ${width} ${i % 2 ? 'self-end' : 'self-start'}`} />
      ))}
    </div>
  );
}
