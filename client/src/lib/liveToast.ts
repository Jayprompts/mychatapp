import { createStore } from './store';

// Rich toasts (per the design): "New message from Bob — hey, lunch?" with an avatar; tap to open.
export type LiveToast = {
  id: number;
  title: string;
  body: string;
  avatar?: { name: string; src: string | null };
  href: string;
};

export const liveToastStore = createStore<LiveToast[]>([]);
let nextId = 1;

export function showLiveToast(t: Omit<LiveToast, 'id'>, durationMs = 5000) {
  const id = nextId++;
  liveToastStore.set((list) => [...list.slice(-2), { ...t, id }]); // at most 3
  setTimeout(() => dismissLiveToast(id), durationMs);
}
export const dismissLiveToast = (id: number) => liveToastStore.set((list) => list.filter((t) => t.id !== id));
