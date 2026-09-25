import { useSyncExternalStore } from 'react';

// A tiny global store for fast-changing, non-server state (presence, typing).
// Components subscribe to just the slice they read, so a typing event doesn't re-render the whole app.
export function createStore<T>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();

  return {
    get: () => state,
    set(update: (prev: T) => T) {
      state = update(state);
      listeners.forEach((l) => l());
    },
    reset() {
      state = initial;
      listeners.forEach((l) => l());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function useStore<T, S>(store: ReturnType<typeof createStore<T>>, select: (state: T) => S): S {
  return useSyncExternalStore(store.subscribe, () => select(store.get()));
}
