import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { PostCard } from '@/features/blog/types';
import type { Conversation, UserSummary } from '@/features/chat/types';
import type { CommunityCard } from '@/features/communities/types';
import { api } from '@/lib/api';
import { createStore } from '@/lib/store';

export const SEARCH_TABS = ['top', 'people', 'messages', 'posts', 'communities'] as const;
export type SearchTab = (typeof SEARCH_TABS)[number];

export type MessageHit = {
  id: string;
  text: string;
  type: 'text' | 'image';
  createdAt: string;
  sender: UserSummary | null;
  conversation: Conversation;
};
export type SearchResults = {
  q: string;
  type: SearchTab;
  people: UserSummary[] | null;
  communities: CommunityCard[] | null;
  posts: PostCard[] | null;
  messages: MessageHit[] | null;
};

export function useSearch(q: string, type: SearchTab) {
  const term = q.trim();
  return useQuery({
    queryKey: ['search', type, term.toLowerCase()],
    queryFn: () => api<SearchResults>(`/search?${new URLSearchParams({ q: term, type })}`),
    enabled: term.length >= 2,
    placeholderData: keepPreviousData, // keep showing results while the next ones load
    staleTime: 30_000,
  });
}

// The overlay is app-wide (opened from the rail, the phone headers, or ⌘K). It remembers the page it
// was opened on, so it closes when you go somewhere else — but not because of a navigation that was
// already finishing when you opened it.
const here = () => window.location.pathname + window.location.search;
export const searchOpenStore = createStore<string | null>(null);
export const openSearch = () => searchOpenStore.set(() => here());
export const closeSearch = () => searchOpenStore.set(() => null);
export const closeSearchIfMoved = () => searchOpenStore.set((openedOn) => (openedOn !== null && openedOn !== here() ? null : openedOn));

// Recent searches, remembered on this device.
const KEY = 'grove.recentSearches';
export function recentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}
export function rememberSearch(q: string) {
  const term = q.trim();
  if (term.length < 2) return;
  try {
    localStorage.setItem(KEY, JSON.stringify([term, ...recentSearches().filter((x) => x.toLowerCase() !== term.toLowerCase())].slice(0, 8)));
  } catch {
    /* private mode */
  }
}
export function clearRecentSearches() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* private mode */
  }
}
