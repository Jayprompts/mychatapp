import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { api, ApiError, upload } from '@/lib/api';
import { queueForReconnect } from '@/lib/connection';
import { getSocket } from '@/lib/socket';
import { useMe } from '@/features/auth/api';
import {
  applyMessageToList,
  applyMessageUpdate,
  applyRead,
  chatKeys,
  removeConversation,
  upsertConversation,
  upsertMessage,
} from './cache';
import { previewFor } from './preview';
import type { Conversation, Message, MessagesPage, ReplyQuote, UserSummary } from './types';

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

// What the optimistic bubble shows as the quote until the server confirms.
const quoteOf = (m?: Message | null): ReplyQuote | null =>
  m ? { id: m.id, senderId: m.senderId, type: m.type, preview: previewFor(m.type, m.text), deleted: false } : null;

// No connection at all (vs. the server refusing): worth waiting for, not a "Tap to retry".
const isNetworkError = (err: unknown) => err instanceof ApiError && err.status === 0;

const newClientId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

/**
 * Optimistic send: the bubble appears instantly as "sending", becomes a real message when the server
 * confirms, or turns "failed" (tap to retry). Offline, it's "queued" instead and goes by itself on
 * reconnect. Retrying reuses the clientId, so it can never duplicate.
 */
export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  const { data: me } = useMe();
  return useCallback(
    (text: string, retryOf?: Message, replyTo?: Message | null) =>
      me ? sendText(qc, me.id, conversationId, text, retryOf, replyTo) : Promise.resolve(),
    [qc, me, conversationId],
  );
}

async function sendText(qc: QueryClient, myId: string, conversationId: string, text: string, retryOf?: Message, replyTo?: Message | null) {
  const quote = retryOf?.replyTo ?? quoteOf(replyTo);
  const clientId = retryOf?.clientId ?? newClientId();
  const optimistic: Message = {
    id: retryOf?.id ?? `temp-${clientId}`,
    conversationId,
    senderId: myId,
    type: 'text',
    text,
    media: null,
    replyTo: quote,
    reactions: [],
    clientId,
    createdAt: retryOf?.createdAt ?? new Date().toISOString(),
    editedAt: null,
    deletedAt: null,
    status: 'sending',
  };
  upsertMessage(qc, optimistic);
  applyMessageToList(qc, optimistic, myId);
  getSocket().emit('typing', { conversationId, isTyping: false });

  try {
    const { message } = await api<{ message: Message }>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: { text, clientId, ...(quote ? { replyTo: quote.id } : {}) },
    });
    upsertMessage(qc, message);
    applyMessageToList(qc, message, myId);
  } catch (err) {
    const failed: Message = { ...optimistic, status: isNetworkError(err) ? 'queued' : 'failed' };
    upsertMessage(qc, failed);
    if (failed.status === 'queued') queueForReconnect(clientId, () => void sendText(qc, myId, conversationId, text, failed));
  }
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

export type MediaDraft = (
  | { kind: 'image'; blob: Blob; width: number; height: number; caption?: string }
  | { kind: 'voice'; blob: Blob; durationMs: number; waveform: number[] }
) & { replyTo?: ReplyQuote | null };

/**
 * Photos & voice notes: shown instantly from the device (with upload progress), then swapped for the
 * server copy. On failure the file is kept in memory, to re-upload by tap (or by itself on reconnect).
 */
export function useSendMedia(conversationId: string) {
  const qc = useQueryClient();
  const { data: me } = useMe();
  return useCallback(
    (draft: MediaDraft, retryOf?: Message) => (me ? sendMedia(qc, me.id, conversationId, draft, retryOf) : Promise.resolve()),
    [qc, me, conversationId],
  );
}

async function sendMedia(qc: QueryClient, myId: string, conversationId: string, draft: MediaDraft, retryOf?: Message) {
  const clientId = retryOf?.clientId ?? newClientId();
  const localUrl = retryOf?.local?.url ?? URL.createObjectURL(draft.blob);

  const optimistic: Message = {
    id: retryOf?.id ?? `temp-${clientId}`,
    conversationId,
    senderId: myId,
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
    replyTo: draft.replyTo ?? null,
    reactions: [],
    clientId,
    createdAt: retryOf?.createdAt ?? new Date().toISOString(),
    editedAt: null,
    deletedAt: null,
    status: 'sending',
    local: { url: localUrl, blob: draft.blob, progress: 0 },
  };
  upsertMessage(qc, optimistic);
  applyMessageToList(qc, optimistic, myId);

  const form = new FormData();
  form.append('kind', draft.kind);
  form.append('clientId', clientId);
  if (draft.kind === 'image' && draft.caption) form.append('text', draft.caption);
  if (draft.replyTo) form.append('replyTo', draft.replyTo.id);
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
    applyMessageToList(qc, message, myId);
  } catch (err) {
    const failed: Message = { ...optimistic, status: isNetworkError(err) ? 'queued' : 'failed' };
    upsertMessage(qc, failed);
    if (failed.status === 'queued') queueForReconnect(clientId, () => void sendMedia(qc, myId, conversationId, draft, failed));
  }
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
    // remove the conversation before this request even finishes — so note its type up front).
    onMutate: () => ({
      type: qc.getQueryData<Conversation[]>(chatKeys.conversations)?.find((c) => c.id === conversationId)?.type,
    }),
    onSuccess: (_data, userId, context) => {
      if (userId !== me?.id) return;
      navigate(context?.type === 'community' ? '/communities' : '/chats', { replace: true });
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

// ── Message actions ─────────────────────────────────────────

export { quoteOf };

/** React with an emoji, or pass null to remove your reaction. Shown instantly, corrected by the server. */
export function useReact(conversationId: string) {
  const qc = useQueryClient();
  const { data: me } = useMe();
  return useMutation({
    mutationFn: ({ message, emoji }: { message: Message; emoji: string | null }) =>
      api<{ message: Message }>(`/conversations/${conversationId}/messages/${message.id}/reaction`, {
        method: emoji ? 'PUT' : 'DELETE',
        body: emoji ? { emoji } : undefined,
      }).then((d) => d.message),
    onMutate: ({ message, emoji }) => {
      if (!me) return;
      const withoutMine = (message.reactions ?? [])
        .map((r) => ({ ...r, userIds: r.userIds.filter((id) => id !== me.id) }))
        .map((r) => ({ ...r, count: r.userIds.length }))
        .filter((r) => r.count > 0);
      const reactions = emoji
        ? withoutMine.some((r) => r.emoji === emoji)
          ? withoutMine.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1, userIds: [...r.userIds, me.id] } : r))
          : [...withoutMine, { emoji, count: 1, userIds: [me.id] }]
        : withoutMine;
      applyMessageUpdate(qc, { ...message, reactions });
      return { previous: message };
    },
    onSuccess: (message) => applyMessageUpdate(qc, message),
    onError: (_err, _vars, ctx) => ctx?.previous && applyMessageUpdate(qc, ctx.previous),
  });
}

export function useEditMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, text }: { messageId: string; text: string }) =>
      api<{ message: Message }>(`/conversations/${conversationId}/messages/${messageId}`, {
        method: 'PATCH',
        body: { text },
      }).then((d) => d.message),
    onSuccess: (message) => applyMessageUpdate(qc, message),
  });
}

export function useDeleteMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) =>
      api<{ message: Message }>(`/conversations/${conversationId}/messages/${messageId}`, { method: 'DELETE' }).then(
        (d) => d.message,
      ),
    onSuccess: (message) => {
      applyMessageUpdate(qc, message);
      void qc.invalidateQueries({ queryKey: ['sharedMedia', conversationId] });
    },
  });
}
