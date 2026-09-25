import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/cn';

export type MenuItem = { label: string; icon: ReactNode; onSelect: () => void; danger?: boolean };

// "⋯" button with a small dropdown (per the design's DotMenu). Closes on outside click and Escape.
export function Menu({ items, label = 'More options', className }: { items: MenuItem[]; label?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (items.length === 0) return null;
  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex size-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
      >
        <MoreHorizontal size={20} />
      </button>
      {open && (
        <div role="menu" className="absolute top-full right-0 z-40 mt-1 min-w-44 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-modal">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className={cn(
                'flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium transition-colors hover:bg-bg',
                item.danger ? 'text-error' : 'text-text-primary',
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
