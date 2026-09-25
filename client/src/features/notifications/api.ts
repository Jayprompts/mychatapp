import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData, type QueryClient } from '@tanstack/react-query';
import { meQueryKey } from '@/features/auth/api';
import type { User } from '@/features/auth/types';
import { api } from '@/lib/api';
import type { AppNotification } from './types';

type Page = { notifications: AppNotification[]; hasMore: boolean; unreadCount: number };
export const notificationKeys = { list: ['notifications', 'list'] as const, count: ['notifications', 'count'] as const };

export function useNotifications(enabled = true) {
  return useInfiniteQuery({
    queryKey: notificationKeys.list,
    queryFn: ({ pageParam }) => api<Page>(`/notifications${pageParam ? `?before=${encodeURIComponent(pageParam)}` : ''}`),
    initialPageParam: '' as string,
    getNextPageParam: (last) => (last.hasMore ? last.notifications.at(-1)?.updatedAt : undefined),
    enabled,
  });
}

export function useUnreadNotifications() {
  return useQuery({
    queryKey: notificationKeys.count,
    queryFn: () => api<{ unreadCount: number }>('/notifications/unread-count').then((d) => d.unreadCount),
    staleTime: 60_000, // live updates keep it fresh
  });
}

// A new (or merged) notification goes to the top of the list.
export function addNotification(qc: QueryClient, n: AppNotification, unreadCount: number) {
  qc.setQueryData(notificationKeys.count, unreadCount);
  qc.setQueryData<InfiniteData<Page>>(notificationKeys.list, (data) => {
    if (!data) return data;
    const pages = data.pages.map((p) => ({ ...p, notifications: p.notifications.filter((x) => x.id !== n.id) }));
    pages[0] = { ...pages[0], notifications: [n, ...pages[0].notifications] };
    return { ...data, pages };
  });
}

function setRead(qc: QueryClient, id: string | 'all') {
  qc.setQueryData<InfiniteData<Page>>(notificationKeys.list, (data) =>
    data
      ? { ...data, pages: data.pages.map((p) => ({ ...p, notifications: p.notifications.map((n) => (id === 'all' || n.id === id ? { ...n, read: true } : n)) })) }
      : data,
  );
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<{ unreadCount: number }>(`/notifications/${id}/read`, { method: 'POST' }),
    onMutate: (id) => setRead(qc, id),
    onSuccess: ({ unreadCount }) => qc.setQueryData(notificationKeys.count, unreadCount),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<{ unreadCount: number }>('/notifications/read-all', { method: 'POST' }),
    onMutate: () => {
      setRead(qc, 'all');
      qc.setQueryData(notificationKeys.count, 0);
    },
  });
}

export function useUpdateNotificationPrefs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prefs: Partial<User['notificationPrefs']>) => api<{ user: User }>('/users/me/notifications', { method: 'PATCH', body: prefs }).then((d) => d.user),
    onSuccess: (user) => qc.setQueryData(meQueryKey, user),
  });
}
