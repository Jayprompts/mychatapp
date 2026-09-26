import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { LockKeyhole } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { getSocket } from '@/lib/socket';
import { leaveExpiredSession, useExpiredSession } from '../api';

// Per the design: the app stays (blurred) behind a card that says what happened, shows whose session
// it was, and takes them back to the login form — then straight back to where they were.
export function SessionExpiredModal() {
  const user = useExpiredSession();
  const qc = useQueryClient();
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (user) getSocket().disconnect(); // stop reconnecting with a dead session
  }, [user]);

  if (!user) return null;
  const logIn = (asSomeoneElse: boolean) => leaveExpiredSession(qc, asSomeoneElse ? {} : { from: pathname + search, identifier: user.username });

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-5 backdrop-blur-[3px]">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-expired-title"
        aria-describedby="session-expired-body"
        className="w-full max-w-[380px] overflow-hidden rounded-[20px] bg-card shadow-modal"
      >
        <div className="gradient-brand h-1.5" />
        <div className="flex flex-col items-center gap-4 px-6 pt-6 pb-7 text-center sm:px-8 sm:pt-7 sm:pb-8">
          <span className="flex size-15 items-center justify-center rounded-full bg-warning/12 text-warning">
            <LockKeyhole size={26} strokeWidth={1.8} />
          </span>
          <div>
            <h2 id="session-expired-title" className="mb-1.5 text-lg font-bold text-text-primary">
              Session expired
            </h2>
            <p id="session-expired-body" className="mx-auto max-w-[280px] text-sm leading-relaxed text-text-secondary">
              For your security, please log in again to continue where you left off.
            </p>
          </div>
          <div className="flex w-full items-center gap-2.5 rounded-[10px] bg-bg px-4 py-2.5 text-left">
            <Avatar name={user.displayName} src={user.avatarUrl} size={28} />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-text-primary">{user.displayName}</p>
              <p className="truncate text-[11px] text-text-secondary">{user.email}</p>
            </div>
          </div>
          <Button fullWidth autoFocus onClick={() => logIn(false)}>
            Log in
          </Button>
          <button type="button" onClick={() => logIn(true)} className="text-[13px] text-text-secondary underline hover:text-text-primary">
            Not you? Use a different account
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
