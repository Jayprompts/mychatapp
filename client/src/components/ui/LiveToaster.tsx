import { useNavigate } from 'react-router';
import { X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { dismissLiveToast, liveToastStore } from '@/lib/liveToast';
import { useStore } from '@/lib/store';

// Per the design: dark card, gradient accent, avatar, "New message from Bob" — top on phones, top-right on desktop.
export function LiveToaster() {
  const toasts = useStore(liveToastStore, (s) => s);
  const navigate = useNavigate();
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-3 top-3 z-[85] flex flex-col items-stretch gap-2 sm:inset-x-auto sm:top-4 sm:right-4 sm:w-[340px]">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="live-toast-enter pointer-events-auto relative flex items-center gap-3 overflow-hidden rounded-[14px] border border-white/8 bg-[#1C1E21] py-3 pr-3 pl-4 shadow-[0_8px_32px_rgba(0,0,0,0.28)]"
        >
          <span className="gradient-brand absolute inset-y-0 left-0 w-[3px]" aria-hidden />
          <button
            type="button"
            onClick={() => {
              dismissLiveToast(t.id);
              navigate(t.href);
            }}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            {t.avatar && <Avatar name={t.avatar.name} src={t.avatar.src} size={38} />}
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-bold text-white">{t.title}</span>
              <span className="block truncate text-xs text-white/65">{t.body}</span>
            </span>
          </button>
          <button type="button" onClick={() => dismissLiveToast(t.id)} aria-label="Dismiss" className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20">
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
