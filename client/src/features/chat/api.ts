import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, upload } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useMe } from '@/features/auth/api';
import {
  applyMessageToList,
  applyRead,
  chatKeys,
  removeConversation,
  upsertConversation,
  upsertMessage,
} from './cache';
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
        media: null,
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

export type MediaDraft =
  | { kind: 'image'; blob: Blob; width: number; height: number; caption?: string }
  | { kind: 'voice'; blob: Blob; durationMs: number; waveform: number[] };

/**
 * Photos & voice notes: shown instantly from the device (with upload progress), then swapped for the
 * server copy. On failure the file is kept in memory so "Tap to retry" can re-upload it.
 */
export function useSendMedia(conversationId: string) {
  const qc = useQueryClient();
  const { data: me } = useMe();

  return useCallback(
    async (draft: MediaDraft, retryOf?: Message) => {
      if (!me) return;
      const clientId = retryOf?.clientId ?? newClientId();
      const localUrl = retryOf?.local?.url ?? URL.createObjectURL(draft.blob);

      const optimistic: Message = {
        id: retryOf?.id ?? `temp-${clientId}`,
        conversationId,
        senderId: me.id,
        type: draft.kind,
        text: draft.kind === 'image' ? (draft.caption ?? '') : '',
        media: {
          url: localUrl,
          mimeType: draft.blob.type,
          size: draft.blob.size,
          durationMs: draft.kind === 'voice' ? draft.durationMs : null,
          waveform: draft.kind === 'voice' ? draft.waveform : null,
          width: draft.kind === 'image' ? draft.width : null,
          height: draft.kind === 'image' ? draft.height : null,
        },
        clientId,
        createdAt: retryOf?.createdAt ?? new Date().toISOString(),
        editedAt: null,
        deletedAt: null,
        status: 'sending',
        local: { url: localUrl, blob: draft.blob, progress: 0 },
      };
      upsertMessage(qc, optimistic);
      applyMessageToList(qc, optimistic, me.id);

      const form = new FormData();
      form.append('kind', draft.kind);
      form.append('clientId', clientId);
      if (draft.kind === 'image' && draft.caption) form.append('text', draft.caption);
      if (draft.kind === 'voice') {
        form.append('durationMs', String(Math.round(draft.durationMs)));
        form.append('waveform', JSON.stringify(draft.waveform));
      }
      const ext = draft.blob.type.split('/')[1]?.split(';')[0] ?? 'bin';
      form.append('file', draft.blob, `${draft.kind}.${ext}`); // file last: server reads fields first

      let lastShown = 0;
      try {
        const { message } = await upload<{ message: Message }>(`/conversations/${conversationId}/media`, form, (p) => {
          if (p - lastShown < 0.05 && p < 1) return; // ~20 progress updates max
          lastShown = p;
          upsertMessage(qc, { ...optimistic, local: { ...optimistic.local!, progress: p } });
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

// ── Groups ─────────────────────────────────────────────────

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; description?: string; memberIds: string[] }) =>
      api<{ conversation: Conversation }>('/conversations/group', { method: 'POST', body: input }).then((d) => d.conversation),
    onSuccess: (conversation) => upsertConversation(qc, conversation),
  });
}

export function useUpdateGroup(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name?: string; description?: string }) =>
      api<{ conversation: Conversation }>(`/conversations/${conversationId}`, { method: 'PATCH', body: input }).then(
        (d) => d.conversation,
      ),
    onSuccess: (conversation) => upsertConversation(qc, conversation),
  });
}

export function useAddMembers(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userIds: string[]) =>
      api<{ conversation: Conversation }>(`/conversations/${conversationId}/members`, {
        method: 'POST',
        body: { userIds },
      }).then((d) => d.conversation),
    onSuccess: (conversation) => upsertConversation(qc, conversation),
  });
}

/** Remove someone — or pass your own id to leave the group (then goes back to the chat list). */
export function useRemoveMember(conversationId: string) {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (userId: string) =>
      api<{ deleted: boolean }>(`/conversations/${conversationId}/members/${userId}`, { method: 'DELETE' }),
    // Hook-level callbacks still run after the chat screen unmounts (the "you left" socket event can
    // remove the conversation before this request even finishes).
    onSuccess: (_data, userId) => {
      if (userId !== me?.id) return;
      navigate('/chats', { replace: true });
      removeConversation(qc, conversationId);
    },
  });
}

export function useSetMemberRole(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'admin' | 'member' }) =>
      api<{ conversation: Conversation }>(`/conversations/${conversationId}/members/${userId}`, {
        method: 'PATCH',
        body: { role },
      }).then((d) => d.conversation),
    onSuccess: (conversation) => upsertConversation(qc, conversation),
  });
}

export function useSharedMedia(conversationId: string, enabled = true) {
  return useQuery({
    queryKey: ['sharedMedia', conversationId],
    queryFn: () => api<{ messages: Message[] }>(`/conversations/${conversationId}/media`).then((d) => d.messages),
    enabled,
  });
}
