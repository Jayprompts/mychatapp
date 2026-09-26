import { api } from './api';

// Web Push: notifications while Grove is closed. Turned on together with desktop notifications
// (one "Notifications on this device" switch); public/sw.js shows them.

export const pushSupported = () => typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

// iPhone/iPad only allow notifications for web apps added to the Home Screen.
export const needsHomeScreen = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone);

let registration: Promise<ServiceWorkerRegistration> | null = null;
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  registration ??= navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready);
  return registration;
}

let serverKey: Promise<string | null> | null = null;
const publicKey = () => (serverKey ??= api<{ publicKey: string | null }>('/push/key').then((d) => d.publicKey, () => null));

const toBytes = (base64url: string) => Uint8Array.from(atob(base64url.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const sameKey = (a: ArrayBuffer | null, b: Uint8Array) => !!a && a.byteLength === b.length && new Uint8Array(a).every((x, i) => x === b[i]);

/**
 * Subscribe this device (or refresh it — e.g. after signing in as someone else). Needs notification permission.
 * stillWanted: checked at the end, so a switch-off that happened meanwhile wins.
 */
export async function subscribePush(stillWanted: () => boolean = () => true): Promise<boolean> {
  if (!pushSupported() || Notification.permission !== 'granted') return false;
  const key = await publicKey();
  const reg = await registerServiceWorker();
  if (!key || !reg) return false;
  const bytes = toBytes(key);
  let sub = await reg.pushManager.getSubscription();
  if (sub && !sameKey(sub.options.applicationServerKey, bytes)) {
    await sub.unsubscribe(); // made for different server keys: start over
    sub = null;
  }
  sub ??= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes });
  const { endpoint, keys } = sub.toJSON();
  await api('/push/subscriptions', { method: 'POST', body: { endpoint, keys } });
  if (!stillWanted()) {
    await unsubscribePush();
    return false;
  }
  return true;
}

/** Stop pushes to this device (switched off, or signing out — call it while still signed in). */
export async function unsubscribePush() {
  if (!('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await api('/push/subscriptions', { method: 'DELETE', body: { endpoint: sub.endpoint } }).catch(() => {});
  await sub.unsubscribe().catch(() => {});
}
