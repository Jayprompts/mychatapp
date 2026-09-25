import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export type LightboxImage = { src: string; alt?: string; caption?: string };

type Props = { images: LightboxImage[]; startIndex: number; onClose: () => void };

// Fullscreen photo viewer (chat photos now, blog galleries later).
// Keyboard: ←/→ to move, Esc to close. Touch: swipe left/right, or swipe down to close.
export function Lightbox({ images, startIndex, onClose }: Props) {
  const [index, setIndex] = useState(startIndex);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const count = images.length;
  const current = images[Math.min(index, count - 1)];

  const go = (delta: number) => setIndex((i) => Math.min(count - 1, Math.max(0, i + delta)));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(count - 1, i + 1));
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [count, onClose]);

  if (!current) return null;

  const arrow =
    'absolute top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-0 sm:flex';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      className="fixed inset-0 z-[60] flex flex-col bg-black/95"
      onClick={onClose}
      onTouchStart={(e) => (touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        const start = touchStart.current;
        if (!start) return;
        const dx = e.changedTouches[0].clientX - start.x;
        const dy = e.changedTouches[0].clientY - start.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
        else if (dy > 90) onClose();
        touchStart.current = null;
      }}
    >
      <header className="flex h-14 shrink-0 items-center justify-between px-4 text-sm text-white/80">
        <span>{count > 1 ? `${index + 1} / ${count}` : ''}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <X size={22} />
        </button>
      </header>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16">
        <img
          key={current.src}
          src={current.src}
          alt={current.alt ?? ''}
          onClick={(e) => e.stopPropagation()}
          className="max-h-full max-w-full rounded-md object-contain select-none"
        />
        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              disabled={index === 0}
              onClick={(e) => (e.stopPropagation(), go(-1))}
              className={`${arrow} left-3`}
            >
              <ChevronLeft size={26} />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              disabled={index === count - 1}
              onClick={(e) => (e.stopPropagation(), go(1))}
              className={`${arrow} right-3`}
            >
              <ChevronRight size={26} />
            </button>
          </>
        )}
      </div>

      <footer className="min-h-14 shrink-0 px-6 py-4 text-center text-[15px] text-white/90">{current.caption}</footer>
    </div>,
    document.body,
  );
}
