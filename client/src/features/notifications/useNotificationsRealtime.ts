import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '@/features/auth/types';
import { chatKeys } from '@/features/chat/cache';
import { previewFor } from '@/features/chat/preview';
import type { Conversation, Message } from '@/features/chat/types';
import { api } from '@/lib/api';
import { showDesktop } from '@/lib/desktopNotify';
import { showLiveToast } from '@/lib/liveToast';
import { getSocket } from '@/lib/socket';
import { addNotification, notificationKeys } from './api';
import { describe } from './format';
import type { AppNotification } from './types';

// Live notifications + "New message from…" toasts. In view: an in-app toast. In a background tab:
// a desktop notification (if switched on). Nothing for the chat you're already looking at.
export function useNotificationsRealtime(me: User | null | undefined) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const where = useRef(pathname);
  const meRef = useRef(me);
  useEffect(() => {
    where.current = pathname;
    meRef.current = me;
  }, [pathname, me]);

  const myId = me?.id;
  useEffect(() => {
    if (!myId) return;
    const socket = getSocket();
    const visible = () => document.visibilityState === 'visible';

    const onNotification = ({ notification: n, unreadCount }: { notification: AppNotification; unreadCount: number }) => {
      addNotification(qc, n, unreadCount);
      if (where.current === '/notifications') return; // already looking at the list
      if (n.type === 'mention' && n.conversationId) return; // the message toast already covers a chat mention
      const { who, action, href } = describe(n);
      const actor = n.actors[0];
      if (visible()) showLiveToast({ title: who, body: action, href, avatar: actor ? { name: actor.displayName, src: actor.avatarUrl } : undefined });
      else showDesktop(who, action, () => navigate(href), n.id);
    };

    const onChanged = ({ unreadCount }: { unreadCount: number }) => {
      qc.setQueryData(notificationKeys.count, unreadCount);
      void qc.invalidateQueries({ queryKey: notificationKeys.list });
    };

    const onMessage = async ({ message: m }: { message: Message }) => {
      if (m.senderId === myId || m.type === 'system' || m.deletedAt) return;
      if (meRef.current?.notificationPrefs.messages === false) return;
      // The first message of a brand-new chat arrives before the chat is in our list: fetch it for the names.
      const c =
        qc.getQueryData<Conversation[]>(chatKeys.conversations)?.find((x) => x.id === m.conversationId) ??
        (await api<{ conversation: Conversation }>(`/conversations/${m.conversationId}`).then((d) => d.conversation, () => undefined));
      const href = c?.community ? `/communities/${c.community.id}` : `/chats/${m.conversationId}`;
      if (where.current === href && visible()) return; // reading that chat right now
      const sender = c?.members.find((x) => x.user.id === m.senderId)?.user;
      const name = sender?.displayName ?? 'Someone';
      const title = c && c.type !== 'direct' ? `${name} in ${c.name}` : `New message from ${name}`;
      const body = previewFor(m.type, m.text ?? '');
      if (visible()) showLiveToast({ title, body, href, avatar: { name, src: sender?.avatarUrl ?? null } });
      else showDesktop(title, body, () => navigate(href), m.conversationId);
    };

    socket.on('notification:new', onNotification);
    socket.on('notifications:changed', onChanged);
    const onMessageEvent = (p: { message: Message }) => void onMessage(p);
    socket.on('message:new', onMessageEvent);
    return () => {
      socket.off('notification:new', onNotification);
      socket.off('notifications:changed', onChanged);
      socket.off('message:new', onMessageEvent); // only ours — the chat hook has its own
    };
  }, [myId, qc, navigate]);
}
