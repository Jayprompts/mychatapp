import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useMarkAllRead, useUnreadNotifications } from '../api';
import { DesktopPrompt } from './DesktopPrompt';
import { NotificationList } from './NotificationList';

const countLabel = (n: number) => (n > 99 ? '99+' : String(n));

// Tablet & desktop: the bell in the side rail opens the notification dropdown (per the design).
export function RailBell() {
  const { pathname } = useLocation();
  const [openOn, setOpenOn] = useState<string | null>(null); // the page it was opened on — navigating closes it
  const open = openOn === pathname;
  const setOpen = (next: boolean | ((o: boolean) => boolean)) =>
    setOpenOn((typeof next === 'function' ? next(open) : next) ? pathname : null);
  const { data: unread = 0 } = useUnreadNotifications();
  const markAll = useMarkAllRead();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpenOn(null);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenOn(null);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        className={cn(
          'relative flex size-11 items-center justify-center rounded-[14px] transition-colors',
          open ? 'bg-primary/12 text-primary' : 'text-text-secondary hover:bg-bg hover:text-text-primary',
        )}
      >
        <Bell size={22} strokeWidth={1.8} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-[1.5px] border-card bg-error-solid px-1 text-[9px] font-bold text-white">
            {countLabel(unread)}
          </span>
        )}
      </button>
      {open && (
        <div role="dialog" aria-label="Notifications" className="fixed top-3 left-[84px] z-50 flex max-h-[calc(100dvh-24px)] w-[380px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_12px_40px_rgba(0,0,0,0.16)]">
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="flex items-center gap-2 text-[15px] font-bold text-text-primary">
              Notifications
              {unread > 0 && <span className="gradient-brand rounded-full px-2 text-[11px] font-bold text-white">{countLabel(unread)}</span>}
            </h2>
            <button type="button" disabled={!unread} onClick={() => markAll.mutate()} className="text-xs font-semibold text-primary hover:underline disabled:text-text-tertiary disabled:no-underline">
              Mark all read
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <DesktopPrompt />
            <NotificationList onOpen={() => setOpen(false)} />
          </div>
          <Link to="/notifications" className="border-t border-border py-2.5 text-center text-[13px] font-semibold text-primary hover:bg-bg">
            See all notifications →
          </Link>
        </div>
      )}
    </div>
  );
}

// Phones: a bell at the top of the Chats list that opens the full-screen page.
export function HeaderBell() {
  const { data: unread = 0 } = useUnreadNotifications();
  return (
    <Link
      to="/notifications"
      aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
      className="relative flex size-10 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-bg sm:hidden"
    >
      <Bell size={22} strokeWidth={1.8} />
      {unread > 0 && (
        <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-[1.5px] border-card bg-error-solid px-1 text-[9px] font-bold text-white">
          {countLabel(unread)}
        </span>
      )}
    </Link>
  );
}
