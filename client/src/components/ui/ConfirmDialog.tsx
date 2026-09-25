import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { TriangleAlert } from 'lucide-react';
import { Button } from './Button';

type Props = {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
};

// The design's shared "are you sure?" pattern for destructive actions (leave group, remove member, delete…).
export function ConfirmDialog({ open, title, body, confirmLabel, onConfirm, onCancel, loading, error }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !loading && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-6 backdrop-blur-[3px]"
      onMouseDown={() => !loading && onCancel()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-[340px] rounded-xl bg-card p-6 pb-5 text-center shadow-modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 flex size-13 items-center justify-center rounded-full bg-error/10 text-error">
          <TriangleAlert size={22} aria-hidden />
        </div>
        <h2 id="confirm-title" className="text-[17px] font-bold text-text-primary">
          {title}
        </h2>
        <div className="mt-2 text-sm leading-relaxed text-text-secondary">{body}</div>
        {error && <p className="mt-3 text-sm font-medium text-error">{error}</p>}
        <div className="mt-6 flex gap-2.5">
          <Button variant="outline" fullWidth onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" fullWidth onClick={onConfirm} loading={loading} autoFocus>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
