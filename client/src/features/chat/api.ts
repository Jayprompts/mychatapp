import { useCallback } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useMe } from '@/features/auth/api';
import { applyMessageToList, applyRead, chatKeys, upsertConversation, upsertMessage } from './cache';
import type { Conversation, Message, MessagesPage, UserSummary } from './types';

export function useConversations() {
  return useQuery({
    queryKey: chatKeys.conversations,
    queryFn: () => api<{ conversations: Conversation[] }>('/conversations').then((d) => d.conversations),
    staleTime: 60_000, // live updates arrive over the socket
  });
}

/** One conversation — read from the chat list cache, or fetched on its own (e.g. opened from a link). */
export function useConversation(conversationId: string) {
  const qc = useQueryClient();
  const list = useConversations();
  const fromList = list.data?.find((c) => c.id === conversationId);

  const single = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      const { conversation } = await api<{ conversation: Conversation }>(`/conversations/${conversationId}`);
      upsertConversation(qc, conversation); // keep the list as the single source of truth
      return conversation;
    },
    enabled: list.isSuccess && !fromList,
  });

  return {
    conversation: fromList ?? single.data,
    isLoading: list.isPending || (!fromList && single.isPending),
    error: list.error ?? single.error,
  };
}

export function useMessages(conversationId: string) {
  return useInfiniteQuery({
    queryKey: chatKeys.messages(conversationId),
    queryFn: ({ pageParam }) =>
      api<MessagesPage>(`/conversations/${conversationId}/messages?limit=30${pageParam ? `&before=${pageParam}` : ''}`),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    staleTime: Infinity, // kept fresh by socket events; refetched after a reconnect
  });
}

const newClientId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

/**
 * Optimistic send: the bubble appears instantly as "sending", becomes a real message when the server
 * confirms, or turns "failed" (tap to retry). Retrying reuses the clientId, so it can never duplicate.
 */
export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  const { data: me } = useMe();

  return useCallback(
    async (text: string, retryOf?: Message) => {
      if (!me) return;
      const optimistic: Message = {
        id: retryOf?.id ?? `temp-${newClientId()}`,
        conversationId,
        senderId: me.id,
        type: 'text',
        text,
        clientId: retryOf?.clientId ?? newClientId(),
        createdAt: retryOf?.createdAt ?? new Date().toISOString(),
        editedAt: null,
        deletedAt: null,
        status: 'sending',
      };
      upsertMessage(qc, optimistic);
      applyMessageToList(qc, optimistic, me.id);
      getSocket().emit('typing', { conversationId, isTyping: false });

      try {
        const { message } = await api<{ message: Message }>(`/conversations/${conversationId}/messages`, {
          method: 'POST',
          body: { text, clientId: optimistic.clientId },
        });
        upsertMessage(qc, message);
        applyMessageToList(qc, message, me.id);
      } catch {
        upsertMessage(qc, { ...optimistic, status: 'failed' });
      }
    },
    [qc, me, conversationId],
  );
}

export function useMarkRead(conversationId: string) {
  const qc = useQueryClient();
  const { data: me } = useMe();
  return useMutation({
    mutationFn: () => api<{ lastReadAt: string }>(`/conversations/${conversationId}/read`, { method: 'POST' }),
    onMutate: () => {
      if (me) applyRead(qc, conversationId, me.id, new Date().toISOString(), me.id); // clear badge instantly
    },
  });
}

export function useUserSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ['users', 'search', q],
    queryFn: () => api<{ users: UserSummary[] }>(`/users/search?q=${encodeURIComponent(q)}`).then((d) => d.users),
    enabled: q.length > 0,
    staleTime: 30_000,
  });
}

export function useOpenDirectChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api<{ conversation: Conversation }>('/conversations/direct', { method: 'POST', body: { userId } }).then(
        (d) => d.conversation,
      ),
    onSuccess: (conversation) => upsertConversation(qc, conversation),
  });
}
