import { useState } from 'react';
import { BellRing } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { desktopPermission, dismissPrompt, enableDesktop, promptDismissed } from '@/lib/desktopNotify';
import { pushSupported } from '@/lib/push';
import { toast } from '@/lib/toast';

// The design's "Never miss a message" pre-prompt — asked once, only when the browser can still ask.
export function DesktopPrompt() {
  const [hidden, setHidden] = useState(() => promptDismissed() || desktopPermission() !== 'default');
  if (hidden) return null;
  return (
    <div className="m-3 rounded-xl border border-primary/15 bg-primary/4 p-3.5">
      <div className="flex gap-3">
        <span className="gradient-brand flex size-9 shrink-0 items-center justify-center rounded-full text-white">
          <BellRing size={17} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-text-primary">Never miss a message</p>
          <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
            Get an alert for messages, mentions and replies when Grove is in another tab{pushSupported() ? ' — or closed' : ''}.
          </p>
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => (dismissPrompt(), setHidden(true))}>
          Not now
        </Button>
        <Button
          size="sm"
          onClick={async () => {
            const on = await enableDesktop();
            setHidden(true);
            toast(on ? "You're all set — notifications are on" : 'Notifications are blocked by your browser — you can allow them in its site settings', on ? 'default' : 'error', on ? 2200 : 4500);
          }}
        >
          Allow
        </Button>
      </div>
    </div>
  );
}
