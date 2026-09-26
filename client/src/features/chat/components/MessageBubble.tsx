import { useRef, type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import { Ban, Check, CheckCheck, CircleAlert, Clock, LoaderCircle, MoreHorizontal, Reply } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/cn';
import { formatTime } from '@/lib/time';
import type { Message, UserSummary } from '../types';
import { PostLinkPreview } from '@/features/blog/components/PostLinkPreview';
import { sharedPostId } from '../linkify';
import { ImageBubble } from './ImageBubble';
import { MessageText } from './MessageText';
import { VoiceBubble } from './VoiceBubble';

export type BubblePosition = { first: boolean; last: boolean };

type MessageBubbleProps = {
  message: Message;
  mine: boolean;
  myId: string;
  sender?: UserSummary;
  quotedName?: string; // who wrote the message this one replies to
  showSenderName: boolean; // group chats
  position: BubblePosition; // place within a run of consecutive messages from the same person
  receipt?: 'sent' | 'seen' | number; // only on my latest message; a number = "Seen by N" (groups)
  highlighted?: boolean; // briefly flashes after jumping to it from a reply
  onRetry?: (message: Message) => void;
  onOpenImage?: (message: Message) => void;
  onOpenActions?: (message: Message, anchor: DOMRect) => void;
  onReply?: (message: Message) => void;
  onJumpTo?: (messageId: string) => void;
  onShowReactions?: (message: Message) => void;
};

const LONG_PRESS_MS = 450;

// Corner radii from the design: 18px, with the "tail" corner at 4px; messages in the same run
// also tuck in the corner that faces the neighbouring bubble.
function radius(mine: boolean, { first }: BubblePosition) {
  if (mine) return cn('rounded-[18px] rounded-br-[4px]', !first && 'rounded-tr-[4px]');
  return cn('rounded-[18px] rounded-bl-[4px]', !first && 'rounded-tl-[4px]');
}

export function MessageBubble(props: MessageBubbleProps) {
  const { message, mine, myId, sender, showSenderName, position, receipt, highlighted } = props;
  const failed = message.status === 'failed';
  const sending = message.status === 'sending';
  const queued = message.status === 'queued'; // offline: goes by itself on reconnect
  const deleted = !!message.deletedAt;
  const interactive = !deleted && !message.status; // confirmed, not unsent
  const bubbleRef = useRef<HTMLDivElement>(null);
  const sharedPost = message.text && !deleted ? sharedPostId(message.text) : null; // a Grove post link → preview card

  const openActions = () => {
    if (interactive && bubbleRef.current) props.onOpenActions?.(message, bubbleRef.current.getBoundingClientRect());
  };

  // Long-press on touch screens opens the action sheet (per the design).
  const press = useRef<{ timer?: ReturnType<typeof setTimeout>; x: number; y: number } | null>(null);
  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType !== 'touch' || !interactive) return;
    press.current = {
      x: e.clientX,
      y: e.clientY,
      timer: setTimeout(() => {
        navigator.vibrate?.(10);
        openActions();
      }, LONG_PRESS_MS),
    };
  };
  const cancelPress = () => {
    clearTimeout(press.current?.timer);
    press.current = null;
  };
  const onPointerMove = (e: PointerEvent) => {
    if (press.current && Math.hypot(e.clientX - press.current.x, e.clientY - press.current.y) > 10) cancelPress();
  };
  const onContextMenu = (e: MouseEvent) => {
    if (!interactive) return;
    e.preventDefault(); // right-click (desktop) or long-press (Android) opens our menu instead
    openActions();
  };

  return (
    <div
      id={`msg-${message.id}`}
      className={cn(
        'group/msg flex items-end gap-2 rounded-lg transition-colors duration-700',
        mine ? 'justify-end' : 'justify-start',
        position.first ? 'mt-3' : 'mt-0.5',
        highlighted && 'bg-primary/10',
      )}
    >
      {!mine && (
        <div className="w-7 shrink-0">
          {position.last && sender && <Avatar name={sender.displayName} src={sender.avatarUrl} size={28} />}
        </div>
      )}

      <div className={cn('flex max-w-[75%] flex-col sm:max-w-[65%]', mine ? 'items-end' : 'items-start')}>
        {showSenderName && !mine && position.first && sender && (
          <span className="mb-1 ml-3 text-xs font-medium text-text-secondary">{sender.displayName}</span>
        )}

        {/* Quoted message this one replies to — tap to jump to it */}
        {message.replyTo && !deleted && (
          <button
            type="button"
            onClick={() => props.onJumpTo?.(message.replyTo!.id)}
            className={cn(
              'mb-[-6px] max-w-full rounded-t-[14px] border-l-[3px] border-primary/50 bg-surface-2/70 pt-1.5 pr-4 pb-3 pl-3 text-left text-xs transition-colors hover:bg-surface-2',
              mine ? 'mr-1' : 'ml-1',
            )}
          >
            <span className="block font-semibold text-text-secondary">
              ↩ {message.replyTo.senderId === myId ? 'You' : (props.quotedName ?? 'Someone')}
            </span>
            <span className={cn('line-clamp-2 text-text-secondary', message.replyTo.deleted && 'italic')}>
              {message.replyTo.deleted ? 'Original message was deleted' : message.replyTo.preview}
            </span>
          </button>
        )}

        <div className={cn('flex items-center gap-1.5', mine ? 'flex-row' : 'flex-row-reverse')}>
          {/* Desktop hover toolbar: Reply + More (sits on the inner side of the bubble) */}
          {interactive && (
            <div className="hidden shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/msg:opacity-100 focus-within:opacity-100 [@media(hover:hover)]:flex">
              <ToolbarButton label="Reply" onClick={() => props.onReply?.(message)}>
                <Reply size={16} />
              </ToolbarButton>
              <ToolbarButton label="More actions" onClick={openActions}>
                <MoreHorizontal size={16} />
              </ToolbarButton>
            </div>
          )}
          {failed && <CircleAlert size={18} className="shrink-0 text-error" aria-label="Not sent" />}

          <div
            ref={bubbleRef}
            onPointerDown={onPointerDown}
            onPointerUp={cancelPress}
            onPointerCancel={cancelPress}
            onPointerLeave={cancelPress}
            onPointerMove={onPointerMove}
            onContextMenu={onContextMenu}
            className={cn(
              'flex min-w-0 flex-col gap-1 [-webkit-touch-callout:none] [@media(pointer:coarse)]:select-none',
              mine ? 'items-end' : 'items-start',
              (failed || queued) && 'opacity-70',
            )}
          >
            {deleted ? (
              <div
                className={cn(
                  'flex items-center gap-1.5 border-[1.5px] border-dashed border-border px-3.5 py-2 text-sm text-text-secondary italic',
                  radius(mine, position),
                )}
              >
                <Ban size={14} aria-hidden /> {mine ? 'You unsent a message' : 'This message was deleted'}
              </div>
            ) : (
              <>
                {message.type === 'image' && message.media && (
                  <ImageBubble
                    message={message}
                    // with a caption, the caption bubble carries the "tail" corner
                    radiusClass={message.text ? 'rounded-[18px]' : radius(mine, position)}
                    onOpen={() => props.onOpenImage?.(message)}
                  />
                )}
                {message.type === 'voice' && message.media && (
                  <VoiceBubble message={message} mine={mine} radiusClass={radius(mine, position)} />
                )}
                {message.text && (
                  <div
                    className={cn(
                      'px-3.5 py-2 text-[15px] leading-snug break-words whitespace-pre-wrap',
                      radius(mine, position),
                      mine ? 'gradient-message text-white' : 'bg-surface-2 text-text-primary',
                      sending && message.type === 'text' && 'opacity-70',
                    )}
                  >
                    <MessageText text={message.text} mine={mine} />
                    {message.editedAt && (
                      <span className={cn('ml-1.5 text-[11px]', mine ? 'text-white/70' : 'text-text-secondary')}>(edited)</span>
                    )}
                  </div>
                )}
                {message.text && sharedPost && <PostLinkPreview postId={sharedPost} />}
              </>
            )}
          </div>
        </div>

        {/* Reaction pills — tap to see who reacted */}
        {!deleted && message.reactions && message.reactions.length > 0 && (
          <button
            type="button"
            onClick={() => props.onShowReactions?.(message)}
            aria-label={`Reactions: ${message.reactions.map((r) => `${r.emoji} ${r.count}`).join(', ')}`}
            className={cn('relative z-[1] -mt-1.5 flex items-center gap-1', mine ? 'mr-2' : 'ml-2')}
          >
            {message.reactions.map((r) => (
              <span
                key={r.emoji}
                className={cn(
                  'flex items-center gap-0.5 rounded-full border bg-card px-1.5 py-0.5 text-[13px] leading-none shadow-card',
                  r.userIds.includes(myId) ? 'border-primary/40 bg-primary/8' : 'border-border',
                )}
              >
                {r.emoji}
                {r.count > 1 && <span className="text-[11px] font-semibold text-text-secondary">{r.count}</span>}
              </span>
            ))}
          </button>
        )}

        {(position.last || failed || queued || (sending && message.type !== 'text')) && (
          <div className="mt-1 flex items-center gap-1 px-1 text-[11px] text-text-secondary">
            {failed ? (
              <button type="button" onClick={() => props.onRetry?.(message)} className="font-medium text-error hover:underline">
                Not sent · Tap to retry
              </button>
            ) : queued ? (
              <>
                <Clock size={11} aria-hidden /> Waiting for connection ·
                <button type="button" onClick={() => props.onRetry?.(message)} className="font-medium text-primary hover:underline">
                  Send now
                </button>
              </>
            ) : sending ? (
              <>
                <LoaderCircle size={11} className="animate-spin" aria-hidden />
                {message.local?.progress !== undefined && message.type !== 'text'
                  ? `Uploading ${Math.round(message.local.progress * 100)}%`
                  : 'Sending…'}
              </>
            ) : (
              <>
                <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
                {receipt === 'seen' && (
                  <span className="flex items-center gap-0.5 text-primary">
                    · <CheckCheck size={13} aria-hidden /> Seen
                  </span>
                )}
                {typeof receipt === 'number' && (
                  <span className="flex items-center gap-0.5 text-primary">
                    · <CheckCheck size={13} aria-hidden /> Seen by {receipt}
                  </span>
                )}
                {receipt === 'sent' && (
                  <span className="flex items-center gap-0.5">
                    · <Check size={13} aria-hidden /> Sent
                  </span>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ToolbarButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
    >
      {children}
    </button>
  );
}
