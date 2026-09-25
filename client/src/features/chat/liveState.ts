import { createStore, useStore } from '@/lib/store';
import type { UserSummary } from './types';

// ── Presence ──────────────────────────────────────────────
// The chat list gives each user's online state at load time; socket events override it live.
type Presence = { online: boolean; lastSeenAt: string | null };
export const presenceStore = createStore<Record<string, Presence>>({});

export function usePresence(user: UserSummary | undefined): Presence {
  const live = useStore(presenceStore, (s) => (user ? s[user.id] : undefined));
  return live ?? { online: user?.online ?? false, lastSeenAt: user?.lastSeenAt ?? null };
}

// ── Typing ────────────────────────────────────────────────
// conversationId -> userIds typing right now. Entries expire on their own in case "stopped typing" is lost.
const NO_ONE: string[] = [];
const TYPING_TTL_MS = 6000;
export const typingStore = createStore<Record<string, string[]>>({});
const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function setTyping(conversationId: string, userId: string, isTyping: boolean) {
  const key = `${conversationId}:${userId}`;
  clearTimeout(typingTimers.get(key));
  typingTimers.delete(key);

  typingStore.set((s) => {
    const current = s[conversationId] ?? NO_ONE;
    const next = isTyping ? [...new Set([...current, userId])] : current.filter((id) => id !== userId);
    return { ...s, [conversationId]: next };
  });

  if (isTyping) {
    typingTimers.set(
      key,
      setTimeout(() => setTyping(conversationId, userId, false), TYPING_TTL_MS),
    );
  }
}

export function useTypingUserIds(conversationId: string): string[] {
  return useStore(typingStore, (s) => s[conversationId] ?? NO_ONE);
}

export function resetLiveState() {
  typingTimers.forEach(clearTimeout);
  typingTimers.clear();
  presenceStore.reset();
  typingStore.reset();
}
