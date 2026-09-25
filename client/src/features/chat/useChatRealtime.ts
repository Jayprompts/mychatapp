import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/lib/socket';
import { meQueryKey } from '@/features/auth/api';
import { applyMessageToList, applyRead, chatKeys, upsertMessage } from './cache';
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
      const known = applyMessageToList(qc, message, myId);
      if (!known) void qc.invalidateQueries({ queryKey: chatKeys.conversations }); // someone started a new chat
    });

    socket.on('conversation:read', ({ conversationId, userId, lastReadAt }) => {
      applyRead(qc, conversationId, userId, lastReadAt, myId);
    });

    socket.on('presence:update', ({ userId, online, lastSeenAt }) => {
      presenceStore.set((s) => ({ ...s, [userId]: { online, lastSeenAt } }));
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
