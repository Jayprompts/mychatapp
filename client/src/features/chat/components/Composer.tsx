import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { SendHorizontal } from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { cn } from '@/lib/cn';
import { useSendMessage } from '../api';

const TYPING_RESEND_MS = 3000; // re-announce "typing" at most every 3s
const TYPING_IDLE_MS = 4000; // stop "typing" after 4s without keystrokes
const MAX_LENGTH = 4000;

export function Composer({ conversationId }: { conversationId: string }) {
  const [text, setText] = useState('');
  const send = useSendMessage(conversationId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastTypingSent = useRef(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const emitTyping = (isTyping: boolean) => getSocket().emit('typing', { conversationId, isTyping });

  const stopTyping = () => {
    clearTimeout(idleTimer.current);
    if (lastTypingSent.current) {
      lastTypingSent.current = 0;
      emitTyping(false);
    }
  };

  // Leaving the conversation = stopped typing.
  useEffect(() => stopTyping, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Grow with the content, up to ~5 lines.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [text]);

  const onChange = (value: string) => {
    setText(value);
    if (!value.trim()) return stopTyping();
    const now = Date.now();
    if (now - lastTypingSent.current > TYPING_RESEND_MS) {
      lastTypingSent.current = now;
      emitTyping(true);
    }
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(stopTyping, TYPING_IDLE_MS);
  };

  const submit = () => {
    const value = text.trim();
    if (!value) return;
    setText('');
    lastTypingSent.current = 0; // sending already clears "typing" on the other side
    clearTimeout(idleTimer.current);
    void send(value);
    textareaRef.current?.focus();
  };

  // Enter sends, Shift+Enter adds a new line (ignored while an IME is composing, e.g. Japanese input).
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const canSend = text.trim().length > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex shrink-0 items-end gap-2 border-t border-border bg-card px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4"
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={stopTyping}
        rows={1}
        maxLength={MAX_LENGTH}
        placeholder="Aa"
        aria-label="Message"
        className="max-h-[140px] min-h-11 flex-1 resize-none rounded-[22px] border-[1.5px] border-border bg-bg px-4 py-2.5 text-[15px] leading-snug text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-primary focus:bg-card"
      />
      <button
        type="submit"
        disabled={!canSend}
        aria-label="Send message"
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-full text-white transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
          canSend ? 'gradient-brand shadow-brand hover:opacity-95 active:scale-95' : 'bg-border text-text-tertiary',
        )}
      >
        <SendHorizontal size={20} />
      </button>
    </form>
  );
}
