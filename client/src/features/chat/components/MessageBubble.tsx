import { Check, CheckCheck, CircleAlert, LoaderCircle } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/cn';
import { formatTime } from '@/lib/time';
import type { Message, UserSummary } from '../types';
import { ImageBubble } from './ImageBubble';
import { VoiceBubble } from './VoiceBubble';

export type BubblePosition = { first: boolean; last: boolean };

type MessageBubbleProps = {
  message: Message;
  mine: boolean;
  sender?: UserSummary;
  showSenderName: boolean; // group chats
  position: BubblePosition; // place within a run of consecutive messages from the same person
  receipt?: 'sent' | 'seen' | number; // only on my latest message; a number = "Seen by N" (groups)
  onRetry?: (message: Message) => void;
  onOpenImage?: (message: Message) => void;
};

// Corner radii from the design: 18px, with the "tail" corner at 4px; messages in the same run
// also tuck in the corner that faces the neighbouring bubble.
function radius(mine: boolean, { first }: BubblePosition) {
  if (mine) return cn('rounded-[18px] rounded-br-[4px]', !first && 'rounded-tr-[4px]');
  return cn('rounded-[18px] rounded-bl-[4px]', !first && 'rounded-tl-[4px]');
}

export function MessageBubble({
  message,
  mine,
  sender,
  showSenderName,
  position,
  receipt,
  onRetry,
  onOpenImage,
}: MessageBubbleProps) {
  const failed = message.status === 'failed';
  const sending = message.status === 'sending';

  return (
    <div className={cn('flex items-end gap-2', mine ? 'justify-end' : 'justify-start', position.first ? 'mt-3' : 'mt-0.5')}>
      {!mine && (
        <div className="w-7 shrink-0">
          {position.last && sender && <Avatar name={sender.displayName} src={sender.avatarUrl} size={28} />}
        </div>
      )}

      <div className={cn('flex max-w-[75%] flex-col sm:max-w-[65%]', mine ? 'items-end' : 'items-start')}>
        {showSenderName && !mine && position.first && sender && (
          <span className="mb-1 ml-3 text-xs font-medium text-text-secondary">{sender.displayName}</span>
        )}

        <div className="flex items-center gap-1.5">
          {failed && <CircleAlert size={18} className="shrink-0 text-error" aria-label="Not sent" />}
          <div className={cn('flex min-w-0 flex-col gap-1', mine ? 'items-end' : 'items-start', failed && 'opacity-70')}>
            {message.type === 'image' && message.media && (
              <ImageBubble
                message={message}
                // with a caption, the caption bubble carries the "tail" corner
                radiusClass={message.text ? 'rounded-[18px]' : radius(mine, position)}
                onOpen={() => onOpenImage?.(message)}
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
                {message.text}
              </div>
            )}
          </div>
        </div>

        {(position.last || failed || (sending && message.type !== 'text')) && (
          <div className="mt-1 flex items-center gap-1 px-1 text-[11px] text-text-secondary">
            {failed ? (
              <button type="button" onClick={() => onRetry?.(message)} className="font-medium text-error hover:underline">
                Not sent · Tap to retry
              </button>
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
