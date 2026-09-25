// Desktop (browser) notifications — shown only while Grove is open in a background tab, and only if the
// person switched them on here (it's a per-device choice) and the browser allows it.

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
  return result === 'granted';
}
export const disableDesktop = () => write(KEY, null);

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
