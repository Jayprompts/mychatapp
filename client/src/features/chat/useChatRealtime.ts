import { useEffect } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { flushOutbox, setSocketState } from '@/lib/connection';
import { getSocket } from '@/lib/socket';
import { isSessionExpired, meQueryKey } from '@/features/auth/api';
import { api } from '@/lib/api';
import {
  applyMessageToList,
  applyMessageUpdate,
  applyRead,
  chatKeys,
  removeConversation,
  upsertConversation,
  upsertMessage,
} from './cache';
import type { Conversation } from './types';
import { presenceStore, resetLiveState, setTyping } from './liveState';

// Connects the socket while logged in and turns server events into cache/store updates.
// Mounted once, in the AppShell.
// Refetch the chat list, even if a load is already in flight: TanStack reuses an in-flight *first*
// load instead of restarting it, and that load may have read the database before this event.
function refreshChatList(qc: QueryClient) {
  void qc.cancelQueries({ queryKey: chatKeys.conversations }).then(() => qc.invalidateQueries({ queryKey: chatKeys.conversations }));
}

export function useChatRealtime(myId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!myId) return;
    const socket = getSocket();
    let connectedBefore = false;

    socket.on('connect', () => {
      setSocketState('connected');
      flushOutbox(); // messages written while offline
      // The chat list may have been read before we joined our live room (even if that read is still
      // in flight) — refetch once now; from here on, new messages arrive live.
      refreshChatList(qc);
      if (connectedBefore) void qc.invalidateQueries({ queryKey: ['messages'] }); // reconnect: open chats may have missed some
      connectedBefore = true;
    });

    socket.on('disconnect', (reason) => {
      if (reason !== 'io server disconnect') return setSocketState('disconnected'); // network: socket.io retries
      // The server hung up on purpose (logged out everywhere, suspended…) and won't be retried: re-check
      // the session — "Session expired" or back to Welcome — and reconnect if it turns out to be fine.
      setSocketState('idle');
      void qc.invalidateQueries({ queryKey: meQueryKey }).then(() => {
        if (qc.getQueryData(meQueryKey) && !isSessionExpired()) socket.connect();
      });
    });

    socket.on('connect_error', (err) => {
      setSocketState('disconnected');
      // Session ended (logout elsewhere / expired): re-check who we are; guards redirect if needed.
      if (err.message === 'Not authenticated') void qc.invalidateQueries({ queryKey: meQueryKey });
    });

    socket.on('message:new', ({ message }) => {
      setTyping(message.conversationId, message.senderId, false);
      upsertMessage(qc, message);
      if (message.type === 'image') void qc.invalidateQueries({ queryKey: ['sharedMedia', message.conversationId] });
      const known = applyMessageToList(qc, message, myId);
      if (!known) refreshChatList(qc); // someone started a new chat (or the list is still loading)
    });

    // Reactions, edits and unsends.
    socket.on('message:updated', ({ message }) => {
      applyMessageUpdate(qc, message);
      if (message.deletedAt) void qc.invalidateQueries({ queryKey: ['sharedMedia', message.conversationId] });
    });

    socket.on('conversation:read', ({ conversationId, userId, lastReadAt }) => {
      applyRead(qc, conversationId, userId, lastReadAt, myId);
    });

    socket.on('presence:update', ({ userId, online, lastSeenAt }) => {
      presenceStore.set((s) => ({ ...s, [userId]: { online, lastSeenAt } }));
    });

    // Group details changed (name, members, roles): refetch just that conversation.
    socket.on('conversation:updated', ({ conversationId }) => {
      void api<{ conversation: Conversation }>(`/conversations/${conversationId}`)
        .then(({ conversation }) => upsertConversation(qc, conversation))
        .catch(() => {});
      void qc.invalidateQueries({ queryKey: ['sharedMedia', conversationId] });
    });

    // I left or was removed from a group.
    socket.on('conversation:removed', ({ conversationId }) => removeConversation(qc, conversationId));

    // Join requests, approvals, edits: refetch community data (approved users also get the chat via message:new).
    socket.on('community:updated', ({ communityId }) => {
      void qc.invalidateQueries({ queryKey: ['communities', 'detail', communityId] });
      void qc.invalidateQueries({ queryKey: ['communities', 'discover'] });
      void qc.invalidateQueries({ queryKey: chatKeys.conversations });
    });

    socket.on('typing', ({ conversationId, userId, isTyping }) => {
      setTyping(conversationId, userId, isTyping);
    });

    socket.connect();

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      setSocketState('idle');
      resetLiveState();
    };
  }, [myId, qc]);
}
