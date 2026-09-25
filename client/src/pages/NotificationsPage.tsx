import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { useMarkAllRead, useUnreadNotifications } from '@/features/notifications/api';
import { DesktopPrompt } from '@/features/notifications/components/DesktopPrompt';
import { NotificationList } from '@/features/notifications/components/NotificationList';

// /notifications — full screen on phones (per the design); also "See all" from the desktop dropdown.
export function NotificationsPage() {
  const navigate = useNavigate();
  const { data: unread = 0 } = useUnreadNotifications();
  const markAll = useMarkAllRead();
  const back = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/chats'));
  return (
    <div className="mx-auto w-full max-w-xl sm:p-6">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/95 px-3 backdrop-blur sm:static sm:mb-3 sm:rounded-t-xl sm:border-0 sm:bg-transparent sm:px-0">
        <button type="button" onClick={back} aria-label="Back" className="flex size-9 items-center justify-center rounded-full border-[1.5px] border-border bg-bg text-text-primary hover:bg-surface-2">
          <ArrowLeft size={18} />
        </button>
        <h1 className="flex flex-1 items-center gap-2 text-lg font-bold text-text-primary">
          Notifications
          {unread > 0 && <span className="gradient-brand rounded-full px-2 text-[11px] font-bold text-white">{unread > 99 ? '99+' : unread}</span>}
        </h1>
        <button type="button" disabled={!unread} onClick={() => markAll.mutate()} className="text-[13px] font-semibold text-primary hover:underline disabled:text-text-tertiary disabled:no-underline">
          Mark all read
        </button>
      </header>
      <div className="overflow-hidden bg-card sm:rounded-xl sm:shadow-card">
        <DesktopPrompt />
        <NotificationList />
      </div>
    </div>
  );
}
