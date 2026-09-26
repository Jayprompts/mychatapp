import { CircleAlert } from 'lucide-react';
import { useStore } from '@/lib/store';
import { toastStore } from '@/lib/toast';
import { cn } from '@/lib/cn';

export function Toaster() {
  const toasts = useStore(toastStore, (s) => s);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(88px+env(safe-area-inset-bottom))] z-[80] flex flex-col items-center gap-2 px-4 sm:bottom-8"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            'toast-enter flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-toast',
            t.tone === 'error' ? 'bg-error' : 'bg-toast/95',
          )}
        >
          {t.tone === 'error' && <CircleAlert size={16} aria-hidden />}
          {t.message}
        </div>
      ))}
    </div>
  );
}
