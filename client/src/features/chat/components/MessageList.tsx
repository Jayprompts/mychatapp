import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Lightbox } from '@/components/ui/Lightbox';
import { Skeleton } from '@/components/ui/Skeleton';
import { errorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';
import { formatDayLabel, isSameDay } from '@/lib/time';
import { useDeleteMessage, useMessages, useReact, useSendMedia, useSendMessage } from '../api';
import { formatSystemEvent } from '../preview';
import type { Conversation, Message } from '../types';
import { ReportDialog } from '@/features/blog/components/ReportDialog';
import type { ReportTarget } from '@/features/blog/types';
import { MessageActionMenu } from './MessageActionMenu';
import { MessageBubble, type BubblePosition } from './MessageBubble';
import { ReactionsSheet } from './ReactionsSheet';
import { TypingBubble } from './TypingBubble';

const GROUP_GAP_MS = 5 * 60 * 1000; // messages within 5 min from the same person form one run
const NEAR_BOTTOM_PX = 150;

type Props = {
  conversation: Conversation;
  myId: string;
  typingUserIds: string[];
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
};

export function MessageList({ conversation, myId, typingUserIds, onReply, onEdit }: Props) {
  const query = useMessages(conversation.id);
  const send = useSendMessage(conversation.id);
  const sendMedia = useSendMedia(conversation.id);
  const [lightboxAt, setLightboxAt] = useState<number | null>(null);
  const [actionsFor, setActionsFor] = useState<{ message: Message; anchor: DOMRect } | null>(null);
  const [reactionsFor, setReactionsFor] = useState<string | null>(null); // message id
  const [deleting, setDeleting] = useState<Message | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [reporting, setReporting] = useState<ReportTarget | null>(null);
  const react = useReact(conversation.id);
  const unsend = useDeleteMessage(conversation.id);
  const scrollRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);

  // pages[0] is the newest page — flip so the list reads oldest -> newest.
  const messages = useMemo(
    () => (query.data ? [...query.data.pages].reverse().flatMap((p) => p.messages) : []),
    [query.data],
  );

  // Every photo in the loaded history, for swiping through in the viewer.
  const photos = useMemo(() => messages.filter((m) => m.type === 'image' && m.media && !m.deletedAt), [messages]);

  const retry = (m: Message) => {
    if (m.type === 'text') return void send(m.text, m);
    const blob = m.local?.blob;
    if (!blob || !m.media) return;
    if (m.type === 'image') {
      void sendMedia({ kind: 'image', blob, width: m.media.width ?? 0, height: m.media.height ?? 0, caption: m.text }, m);
    } else {
      void sendMedia({ kind: 'voice', blob, durationMs: m.media.durationMs ?? 0, waveform: m.media.waveform ?? [] }, m);
    }
  };

  const members = useMemo(() => new Map(conversation.members.map((m) => [m.user.id, m])), [conversation.members]);
  const byId = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);
  const nameOf = (userId: string) => members.get(userId)?.user.displayName;
  const myReactionOn = (m: Message) => m.reactions?.find((r) => r.userIds.includes(myId))?.emoji ?? null;

  const copy = async (m: Message) => {
    try {
      await navigator.clipboard.writeText(m.text);
      toast('Copied');
    } catch {
      toast("Couldn't copy", 'error');
    }
  };
  const isGroup = conversation.type !== 'direct';

  // Read receipt on my latest message: "Seen" once every other member has read it,
  // "Seen by N" while only some have (groups), otherwise "Sent".
  const lastMine = [...messages].reverse().find((m) => m.senderId === myId && !m.status && m.type !== 'system');
  let receipt: 'sent' | 'seen' | number | undefined;
  if (lastMine) {
    const others = conversation.members.filter((m) => m.user.id !== myId);
    const seenBy = others.filter((m) => new Date(m.lastReadAt).getTime() >= new Date(lastMine.createdAt).getTime()).length;
    receipt = others.length > 0 && seenBy === others.length ? 'seen' : seenBy > 0 ? seenBy : 'sent';
  }

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

  // Tap a quote → scroll to the original, loading older pages if it isn't on screen yet.
  const jumpTo = useCallback(
    async (messageId: string) => {
      const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      let more = hasNextPage;
      for (let i = 0; i < 15; i++) {
        const el = document.getElementById(`msg-${messageId}`);
        if (el) {
          // Instant, not smooth: a smooth scroll can be cut short when reaching the top loads older
          // messages (the list then holds its position). Settle, and re-centre if something moved.
          el.scrollIntoView({ block: 'center' });
          await frame();
          const box = el.getBoundingClientRect();
          const view = scrollRef.current?.getBoundingClientRect();
          if (view && (box.bottom < view.top || box.top > view.bottom)) el.scrollIntoView({ block: 'center' });
          setHighlightedId(messageId);
          setTimeout(() => setHighlightedId((h) => (h === messageId ? null : h)), 1600);
          return;
        }
        if (!more) break;
        more = (await fetchNextPage()).hasNextPage;
        await frame();
      }
      toast("The original message isn't available");
    },
    [hasNextPage, fetchNextPage],
  );

  // Opened from search (…?m=<messageId>): jump to that message once history is loaded, then tidy the URL.
  const [params, setParams] = useSearchParams();
  const target = params.get('m');
  const loaded = query.isSuccess;
  useEffect(() => {
    if (!loaded || !target) return;
    const t = setTimeout(() => {
      void jumpTo(target).finally(() =>
        setParams(
          (p) => {
            p.delete('m');
            return p;
          },
          { replace: true },
        ),
      );
    }, 0); // next tick: the list has rendered
    return () => clearTimeout(t);
  }, [loaded, target, jumpTo, setParams]);

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
      a.type !== 'system' &&
      b.type !== 'system' &&
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
            {m.type === 'system' ? (
              <p className="my-3 px-6 text-center text-xs text-text-secondary">
                {m.system ? formatSystemEvent(m.system, myId) : m.text}
              </p>
            ) : (
            <MessageBubble
              message={m}
              mine={m.senderId === myId}
              myId={myId}
              quotedName={m.replyTo ? nameOf(m.replyTo.senderId) : undefined}
              highlighted={highlightedId === m.id}
              onOpenActions={(message, anchor) => setActionsFor({ message, anchor })}
              onReply={onReply}
              onJumpTo={jumpTo}
              onShowReactions={(message) => setReactionsFor(message.id)}
              sender={members.get(m.senderId)?.user}
              showSenderName={isGroup}
              position={position(i)}
              receipt={m.id === lastMine?.id ? receipt : undefined}
              onRetry={retry}
              onOpenImage={(img) => setLightboxAt(photos.findIndex((p) => p.id === img.id))}
            />
            )}
          </Fragment>
        ))
      )}

      {typingUserIds.length > 0 && <TypingBubble users={typingUserIds.map((id) => members.get(id)?.user)} />}

      {actionsFor && (
        <MessageActionMenu
          message={actionsFor.message}
          mine={actionsFor.message.senderId === myId}
          myReaction={myReactionOn(actionsFor.message)}
          anchor={actionsFor.anchor}
          onClose={() => setActionsFor(null)}
          onReact={(emoji) => react.mutate({ message: actionsFor.message, emoji })}
          onReply={() => onReply(actionsFor.message)}
          onCopy={() => void copy(actionsFor.message)}
          onEdit={() => onEdit(actionsFor.message)}
          onDelete={() => setDeleting(actionsFor.message)}
          onReport={() => setReporting({ type: 'message', id: actionsFor.message.id })}
        />
      )}
      <ReportDialog target={reporting} onClose={() => setReporting(null)} />

      <ReactionsSheet
        message={reactionsFor ? (byId.get(reactionsFor) ?? null) : null}
        members={members}
        myId={myId}
        onClose={() => setReactionsFor(null)}
        onRemoveMine={(message) => react.mutate({ message, emoji: null })}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Unsend this message?"
        body={
          deleting?.media
            ? 'It will be removed for everyone in this chat, and the file will be deleted.'
            : 'It will be removed for everyone in this chat.'
        }
        confirmLabel="Unsend"
        loading={unsend.isPending}
        error={unsend.isError ? errorMessage(unsend.error) : null}
        onCancel={() => {
          setDeleting(null);
          unsend.reset();
        }}
        onConfirm={() => deleting && unsend.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />

      {lightboxAt !== null && lightboxAt >= 0 && (
        <Lightbox
          startIndex={lightboxAt}
          onClose={() => setLightboxAt(null)}
          images={photos.map((p) => ({
            src: p.local?.url ?? p.media!.url,
            caption: p.text || `${members.get(p.senderId)?.user.displayName ?? ''} · ${formatDayLabel(p.createdAt)}`,
          }))}
        />
      )}
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

