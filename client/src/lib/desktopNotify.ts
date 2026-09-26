// Notifications on this device — a per-device choice, and only if the browser allows it:
//   Grove open in a background tab → shown from here (showDesktop)
//   Grove closed                   → Web Push, shown by the service worker (lib/push.ts, public/sw.js)
import { subscribePush, unsubscribePush } from './push';

const KEY = 'grove.desktopNotifications';
const DISMISSED = 'grove.desktopPromptDismissed';

export const desktopSupported = () => typeof window !== 'undefined' && 'Notification' in window;
export const desktopPermission = (): NotificationPermission | 'unsupported' => (desktopSupported() ? Notification.permission : 'unsupported');

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* private mode: fine, it just won't be remembered */
  }
}

export const desktopEnabled = () => desktopPermission() === 'granted' && read(KEY) === 'on';

// Ask the browser (only ever from a click — browsers ignore prompts that come out of nowhere).
export async function enableDesktop(): Promise<boolean> {
  if (!desktopSupported()) return false;
  const result = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  write(KEY, result === 'granted' ? 'on' : null);
  write(DISMISSED, '1');
  if (result === 'granted') void subscribePush(desktopEnabled).catch(() => {}); // …and while Grove is closed
  return result === 'granted';
}
export function disableDesktop() {
  write(KEY, null);
  void unsubscribePush();
}

// The "Never miss a message" card shows until you answer it once.
export const promptDismissed = () => read(DISMISSED) === '1';
export const dismissPrompt = () => write(DISMISSED, '1');

export function showDesktop(title: string, body: string, onClick: () => void, tag?: string) {
  if (!desktopEnabled() || document.visibilityState === 'visible') return; // in view: the in-app toast is enough
  try {
    const n = new Notification(title, { body, icon: '/icon-192.png', badge: '/icon-192.png', tag });
    n.onclick = () => {
      window.focus();
      onClick();
      n.close();
    };
  } catch {
    /* some mobile browsers only allow notifications from a service worker */
  }
}
