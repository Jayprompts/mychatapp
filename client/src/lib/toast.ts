import { createStore } from './store';

// Tiny app-wide toasts: toast('Copied'). Rendered by <Toaster /> at the app root (main.tsx).
export type Toast = { id: number; message: string; tone: 'default' | 'error' };

export const toastStore = createStore<Toast[]>([]);
let nextId = 1;

export function toast(message: string, tone: Toast['tone'] = 'default', durationMs = 2200) {
  const id = nextId++;
  toastStore.set((list) => [...list.slice(-2), { id, message, tone }]); // at most 3 on screen
  setTimeout(() => toastStore.set((list) => list.filter((t) => t.id !== id)), durationMs);
}
