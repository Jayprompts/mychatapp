import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Flag, Pencil, Reply, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { EDIT_WINDOW_MS, QUICK_REACTIONS } from '../preview';
import type { Message } from '../types';

type Props = {
  message: Message;
  mine: boolean;
  myReaction: string | null;
  anchor: DOMRect; // the bubble that was long-pressed / right-clicked
  onClose: () => void;
  onReact: (emoji: string | null) => void;
  onReply: () => void;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReport: () => void;
};

const isPhone = () => window.matchMedia('(max-width: 639px), (pointer: coarse)').matches;

// Design: popover next to the message on desktop, bottom sheet on phones.
export function MessageActionMenu(props: Props) {
  const { message, mine, myReaction, anchor, onClose } = props;
  const [sheet] = useState(isPhone);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const [openedAt] = useState(() => Date.now()); // edit window is checked when the menu opens
  const canEdit = mine && message.type === 'text' && openedAt - new Date(message.createdAt).getTime() < EDIT_WINDOW_MS;
  const canCopy = message.text.length > 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onClose);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onClose);
    };
  }, [onClose]);

  // Desktop: sit under the bubble (or above it if there's no room), aligned to the bubble's side.
  useLayoutEffect(() => {
    if (sheet || !menuRef.current) return;
    const { width, height } = menuRef.current.getBoundingClientRect();
    const gap = 6;
    const top = anchor.bottom + gap + height > window.innerHeight - 8 ? Math.max(8, anchor.top - gap - height) : anchor.bottom + gap;
    const left = mine ? anchor.right - width : anchor.left;
    setPos({ top, left: Math.min(Math.max(8, left), window.innerWidth - width - 8) });
  }, [sheet, anchor, mine]);

  const run = (fn: () => void) => () => {
    fn();
    onClose();
  };

  const content = (
    <>
      <div className="flex items-center justify-between gap-1 px-2 py-2" role="group" aria-label="React">
        {QUICK_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={run(() => props.onReact(myReaction === emoji ? null : emoji))}
            aria-label={myReaction === emoji ? `Remove ${emoji} reaction` : `React ${emoji}`}
            aria-pressed={myReaction === emoji}
            className={cn(
              'flex size-10 items-center justify-center rounded-full text-[22px] transition-transform hover:scale-125 active:scale-95',
              myReaction === emoji && 'bg-primary/12 ring-2 ring-primary/30',
            )}
          >
            {emoji}
          </button>
        ))}
      </div>
      <div className="h-px bg-border" />
      <ul role="menu" className="py-1">
        <Item icon={<Reply size={18} />} label="Reply" onClick={run(props.onReply)} />
        {canCopy && <Item icon={<Copy size={18} />} label="Copy text" onClick={run(props.onCopy)} />}
        {canEdit && <Item icon={<Pencil size={18} />} label="Edit" onClick={run(props.onEdit)} />}
        {mine && <Item icon={<Trash2 size={18} />} label="Unsend" danger onClick={run(props.onDelete)} />}
        {!mine && <Item icon={<Flag size={18} />} label="Report" danger onClick={run(props.onReport)} />}
      </ul>
    </>
  );

  return createPortal(
    sheet ? (
      <div
        className="fixed inset-0 z-[65] flex items-end bg-black/40"
        // Lifting the finger after a long-press fires a late tap on this backdrop — ignore the first 400ms.
        onPointerDown={(e) => e.target === e.currentTarget && Date.now() - openedAt > 400 && onClose()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div
          role="dialog"
          aria-label="Message actions"
          className="w-full rounded-t-xl bg-card pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-modal"
        >
          <div className="mx-auto mt-2 mb-1 h-1 w-9 rounded-full bg-border" />
          {content}
        </div>
      </div>
    ) : (
      <div className="fixed inset-0 z-[65]" onMouseDown={onClose} onContextMenu={(e) => (e.preventDefault(), onClose())}>
        <div
          ref={menuRef}
          role="dialog"
          aria-label="Message actions"
          onMouseDown={(e) => e.stopPropagation()}
          className="fixed w-[300px] overflow-hidden rounded-lg bg-card shadow-modal"
          style={pos ? { top: pos.top, left: pos.left } : { visibility: 'hidden', top: 0, left: 0 }}
        >
          {content}
        </div>
      </div>
    ),
    document.body,
  );
}

function Item({ icon, label, onClick, danger }: { icon: ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <li>
      <button
        type="button"
        role="menuitem"
        onClick={onClick}
        className={cn(
          'flex w-full items-center gap-3 px-4 py-2.5 text-left text-[15px] font-medium transition-colors hover:bg-bg focus-visible:bg-bg focus-visible:outline-none',
          danger ? 'text-error' : 'text-text-primary',
        )}
      >
        {icon}
        {label}
      </button>
    </li>
  );
}
