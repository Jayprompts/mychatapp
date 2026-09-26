import { createStore, useStore } from './store';

// Are we online? Two signals: the browser's own (Wi-Fi off, airplane mode) and the live socket
// (server unreachable, flaky network). Drives the offline banner and the message outbox.
type SocketState = 'connected' | 'disconnected' | 'idle';
export type Banner = 'offline' | 'reconnecting' | 'back' | null;
type Connection = { online: boolean; socket: SocketState; banner: Banner };

export const connectionStore = createStore<Connection>({ online: navigator.onLine, socket: 'idle', banner: null });
export const useConnection = () => useStore(connectionStore, (s) => s);

// The banner (per the design): amber while the device is offline; "Reconnecting…" when online but the
// live connection dropped — only after a few seconds, so blips stay invisible; then a short "Back online".
let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
let backTimer: ReturnType<typeof setTimeout> | undefined;
let wasDown = false;
const setBanner = (banner: Banner) => connectionStore.set((s) => (s.banner === banner ? s : { ...s, banner }));

function updateBanner() {
  const { online, socket, banner } = connectionStore.get();
  clearTimeout(backTimer);
  if (!online) {
    clearTimeout(reconnectTimer);
    reconnectTimer = undefined;
    wasDown = true;
    return setBanner('offline');
  }
  if (socket === 'disconnected') {
    if (banner === 'offline') return setBanner('reconnecting'); // Wi-Fi is back; the socket is catching up
    reconnectTimer ??= setTimeout(() => {
      wasDown = true;
      setBanner('reconnecting');
    }, 4000);
    return;
  }
  clearTimeout(reconnectTimer);
  reconnectTimer = undefined;
  if (!wasDown) return setBanner(null);
  wasDown = false;
  setBanner('back');
  backTimer = setTimeout(() => setBanner(null), 2000);
}

export function setSocketState(socket: SocketState) {
  connectionStore.set((s) => (s.socket === socket ? s : { ...s, socket }));
  updateBanner();
}

// ── Outbox: messages that failed only because we were offline, re-sent on reconnect ──
// Keyed by clientId, so a retry can never duplicate (the server dedupes on it too).
const outbox = new Map<string, () => void>();

export function queueForReconnect(clientId: string, resend: () => void) {
  outbox.set(clientId, resend);
}
export function dropFromOutbox(clientId: string) {
  outbox.delete(clientId);
}
export function flushOutbox() {
  if (!navigator.onLine || outbox.size === 0) return;
  const pending = [...outbox.values()];
  outbox.clear();
  pending.forEach((resend) => resend()); // each re-queues itself if it fails again
}

window.addEventListener('online', () => {
  connectionStore.set((s) => ({ ...s, online: true }));
  updateBanner();
  flushOutbox();
});
window.addEventListener('offline', () => {
  connectionStore.set((s) => ({ ...s, online: false }));
  updateBanner();
});
