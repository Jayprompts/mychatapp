import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent, type ReactNode } from 'react';
import { Check, ImagePlus, Mic, MicOff, Pencil, Reply, SendHorizontal, Trash2, X } from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { cn } from '@/lib/cn';
import { ImagePrepError, prepareImage } from '@/lib/image';
import { errorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';
import { quoteOf, useEditMessage, useSendMedia, useSendMessage } from '../api';
import { previewFor } from '../preview';
import type { Message } from '../types';
import { MAX_RECORDING_MS, useVoiceRecorder, type Recording } from '../useVoiceRecorder';

const TYPING_RESEND_MS = 3000; // re-announce "typing" at most every 3s
const TYPING_IDLE_MS = 4000; // stop "typing" after 4s without keystrokes
const MAX_LENGTH = 4000;
const MAX_PHOTOS_AT_ONCE = 10;
const MIN_VOICE_MS = 700;

function formatClock(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

type ComposerProps = {
  conversationId: string;
  replyTo: Message | null; // "Replying to …" bar
  replyToName?: string;
  onCancelReply: () => void;
  editing: Message | null; // "Editing message" bar — text is loaded into the box
  onDoneEditing: () => void;
};

export function Composer({ conversationId, replyTo, replyToName, onCancelReply, editing, onDoneEditing }: ComposerProps) {
  const [text, setText] = useState('');
  const edit = useEditMessage(conversationId);
  const [notice, setNotice] = useState<string | null>(null);
  const send = useSendMessage(conversationId);
  const sendMedia = useSendMedia(conversationId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastTypingSent = useRef(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const sendRecording = (r: Recording) => {
    if (r.durationMs < MIN_VOICE_MS) return setNotice('That recording was too short — tap the mic and speak, then tap send.');
    void sendMedia({ kind: 'voice', blob: r.blob, durationMs: r.durationMs, waveform: r.waveform, replyTo: quoteOf(replyTo) });
    onCancelReply();
  };
  const recorder = useVoiceRecorder({ onAutoStop: sendRecording });
  const recording = recorder.state.status === 'recording' || recorder.state.status === 'requesting';

  // ── typing indicator ──────────────────────────────────────
  const emitTyping = (isTyping: boolean) => getSocket().emit('typing', { conversationId, isTyping });
  const stopTyping = () => {
    clearTimeout(idleTimer.current);
    if (lastTypingSent.current) {
      lastTypingSent.current = 0;
      emitTyping(false);
    }
  };
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
    setNotice(null);
    if (!value.trim()) return stopTyping();
    const now = Date.now();
    if (now - lastTypingSent.current > TYPING_RESEND_MS) {
      lastTypingSent.current = now;
      emitTyping(true);
    }
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(stopTyping, TYPING_IDLE_MS);
  };

  // Starting an edit loads the message into the box; starting a reply focuses the box.
  const [editingId, setEditingId] = useState<string | null>(null);
  if ((editing?.id ?? null) !== editingId) {
    setEditingId(editing?.id ?? null);
    setText(editing ? editing.text : '');
  }
  useEffect(() => {
    if (editing || replyTo) textareaRef.current?.focus();
  }, [editing, replyTo]);

  const cancelEdit = () => {
    onDoneEditing();
    setText('');
  };

  const submitText = () => {
    const value = text.trim();
    if (!value) return;

    if (editing) {
      if (value === editing.text) return cancelEdit();
      edit.mutate(
        { messageId: editing.id, text: value },
        { onSuccess: cancelEdit, onError: (err) => toast(errorMessage(err), 'error') },
      );
      return;
    }

    setText('');
    lastTypingSent.current = 0; // sending already clears "typing" on the other side
    clearTimeout(idleTimer.current);
    void send(value, undefined, replyTo);
    onCancelReply();
    textareaRef.current?.focus();
  };

  // ── photos ────────────────────────────────────────────────
  const sendPhotos = async (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith('image/'));
    if (images.length === 0) return;
    if (images.length > MAX_PHOTOS_AT_ONCE) setNotice(`You can send up to ${MAX_PHOTOS_AT_ONCE} photos at a time.`);
    for (const file of images.slice(0, MAX_PHOTOS_AT_ONCE)) {
      try {
        const prepared = await prepareImage(file);
        void sendMedia({ kind: 'image', ...prepared, replyTo: quoteOf(replyTo) });
        onCancelReply();
      } catch (err) {
        setNotice(err instanceof ImagePrepError ? err.message : `"${file.name}" couldn't be sent.`);
      }
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(e.clipboardData.files);
    if (files.some((f) => f.type.startsWith('image/'))) {
      e.preventDefault(); // pasting a screenshot sends it as a photo
      void sendPhotos(files);
    }
  };

  // ── voice ─────────────────────────────────────────────────
  const finishRecording = async () => {
    const r = await recorder.stop();
    if (r) sendRecording(r);
  };

  useEffect(() => {
    if (!recording) return;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && recorder.cancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [recording, recorder]);

  // Enter sends, Shift+Enter adds a new line (ignored while an IME is composing, e.g. Japanese input).
  // Esc cancels an edit or reply.
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape' && (editing || replyTo)) {
      e.preventDefault();
      if (editing) cancelEdit();
      else onCancelReply();
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submitText();
    }
  };

  const hasText = text.trim().length > 0;
  const iconBtn =
    'flex size-11 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

  return (
    <div className="shrink-0 border-t border-border bg-card">
      {recorder.state.status === 'denied' && (
        <Banner icon={<MicOff size={16} />} onDismiss={recorder.reset}>
          <span>
            <strong className="font-semibold">Microphone access needed</strong> to record voice notes. If nothing pops up,
            allow the microphone in your browser&apos;s site settings.
          </span>
          <button type="button" onClick={() => void recorder.start()} className="shrink-0 font-semibold text-primary hover:underline">
            Grant access
          </button>
        </Banner>
      )}
      {recorder.state.status === 'error' && (
        <Banner icon={<MicOff size={16} />} onDismiss={recorder.reset}>
          {recorder.state.message}
        </Banner>
      )}
      {notice && (
        <Banner onDismiss={() => setNotice(null)}>
          <span>{notice}</span>
        </Banner>
      )}

      {(editing || replyTo) && !recording && (
        <div className="flex items-center gap-3 border-b border-border px-4 py-2">
          <span className="text-primary">{editing ? <Pencil size={18} /> : <Reply size={18} />}</span>
          <div className="min-w-0 flex-1 border-l-[3px] border-primary/50 pl-2.5">
            <p className="text-xs font-semibold text-primary">
              {editing ? 'Editing message' : `Replying to ${replyToName ?? 'message'}`}
            </p>
            <p className="truncate text-[13px] text-text-secondary">
              {editing ? editing.text : replyTo ? previewFor(replyTo.type, replyTo.text) : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={editing ? cancelEdit : onCancelReply}
            aria-label={editing ? 'Cancel editing' : 'Cancel reply'}
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-bg hover:text-text-primary"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-1.5 px-2 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:gap-2 sm:px-4">
        {recording ? (
          // ── Recording bar ──
          <>
            <button
              type="button"
              onClick={recorder.cancel}
              aria-label="Cancel recording"
              className={cn(iconBtn, 'text-error hover:bg-error/8')}
            >
              <Trash2 size={21} />
            </button>
            <div className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-[22px] bg-bg px-4" aria-live="polite">
              <span className="size-2.5 shrink-0 animate-pulse rounded-full bg-error-solid" aria-hidden />
              <span className="w-10 shrink-0 text-sm font-medium text-text-primary tabular-nums">
                {recorder.state.status === 'requesting' ? '…' : formatClock(recorder.elapsedMs)}
              </span>
              <div className="flex h-7 min-w-0 flex-1 items-center justify-end gap-[3px] overflow-hidden" aria-hidden>
                {recorder.liveLevels.map((level, i) => (
                  <span key={i} className="w-[3px] shrink-0 rounded-full bg-primary-solid" style={{ height: `${Math.max(12, level * 100)}%` }} />
                ))}
              </div>
              {recorder.elapsedMs > MAX_RECORDING_MS - 15_000 && (
                <span className="shrink-0 text-xs text-error">{Math.ceil((MAX_RECORDING_MS - recorder.elapsedMs) / 1000)}s left</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => void finishRecording()}
              disabled={recorder.state.status !== 'recording'}
              aria-label="Send voice message"
              className={cn(iconBtn, 'gradient-brand text-white shadow-brand active:scale-95 disabled:opacity-50')}
            >
              <SendHorizontal size={20} />
            </button>
          </>
        ) : (
          // ── Normal composer ──
          <>
            {!editing && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Send photos"
                className={cn(iconBtn, 'text-primary hover:bg-primary/8')}
              >
                <ImagePlus size={22} />
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                void sendPhotos(Array.from(e.target.files ?? []));
                e.target.value = ''; // allow picking the same photo again
              }}
            />
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={onKeyDown}
              onPaste={onPaste}
              onBlur={stopTyping}
              rows={1}
              maxLength={MAX_LENGTH}
              placeholder="Aa"
              aria-label="Message"
              className="max-h-[140px] min-h-11 min-w-0 flex-1 resize-none rounded-[22px] border-[1.5px] border-border bg-bg px-4 py-2.5 text-[15px] leading-snug text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-primary focus:bg-card"
            />
            {editing ? (
              <button
                type="button"
                onClick={submitText}
                disabled={!hasText || edit.isPending}
                aria-label="Save edit"
                className={cn(iconBtn, 'gradient-brand text-white shadow-brand hover:opacity-95 active:scale-95 disabled:opacity-50')}
              >
                <Check size={20} strokeWidth={2.5} />
              </button>
            ) : hasText ? (
              <button
                type="button"
                onClick={submitText}
                aria-label="Send message"
                className={cn(iconBtn, 'gradient-brand text-white shadow-brand hover:opacity-95 active:scale-95')}
              >
                <SendHorizontal size={20} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void recorder.start()}
                aria-label="Record voice message"
                className={cn(iconBtn, 'text-primary hover:bg-primary/8')}
              >
                <Mic size={22} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Banner({ icon, children, onDismiss }: { icon?: ReactNode; children: ReactNode; onDismiss: () => void }) {
  return (
    <div role="status" className="flex items-center gap-2.5 border-b border-border bg-warning/10 px-4 py-2.5 text-[13px] text-text-primary">
      {icon && <span className="shrink-0 text-warning">{icon}</span>}
      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-1">{children}</div>
      <button type="button" onClick={onDismiss} aria-label="Dismiss" className="shrink-0 rounded-full p-1 text-text-secondary hover:text-text-primary">
        <X size={15} />
      </button>
    </div>
  );
}
