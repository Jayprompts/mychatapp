import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/lib/socket';
import { meQueryKey } from '@/features/auth/api';
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
export function useChatRealtime(myId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!myId) return;
    const socket = getSocket();
    let connectedBefore = false;

    socket.on('connect', () => {
      // After a reconnect we may have missed events — refetch chat data once.
      if (connectedBefore) {
        void qc.invalidateQueries({ queryKey: chatKeys.conversations });
        void qc.invalidateQueries({ queryKey: ['messages'] });
      }
      connectedBefore = true;
    });

    socket.on('connect_error', (err) => {
      // Session ended (logout elsewhere / expired): re-check who we are; guards redirect if needed.
      if (err.message === 'Not authenticated') void qc.invalidateQueries({ queryKey: meQueryKey });
    });

    socket.on('message:new', ({ message }) => {
      setTyping(message.conversationId, message.senderId, false);
      upsertMessage(qc, message);
      if (message.type === 'image') void qc.invalidateQueries({ queryKey: ['sharedMedia', message.conversationId] });
      const known = applyMessageToList(qc, message, myId);
      if (!known) void qc.invalidateQueries({ queryKey: chatKeys.conversations }); // someone started a new chat
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
      resetLiveState();
    };
  }, [myId, qc]);
}
