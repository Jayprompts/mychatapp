import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import { previewFor } from './preview';
import type { Conversation, Message, MessagesPage } from './types';

// Every change to chat data — from the API, an optimistic send, or a socket event — goes through
// these helpers, so the chat list, the open conversation and the unread badge never disagree.

export const chatKeys = {
  conversations: ['conversations'] as const,
  messages: (conversationId: string) => ['messages', conversationId] as const,
};

type MessagesCache = InfiniteData<MessagesPage, string | null>;

/** Insert or replace a message in a conversation's loaded history (matched by id, then clientId). */
export function upsertMessage(qc: QueryClient, message: Message) {
  qc.setQueryData<MessagesCache>(chatKeys.messages(message.conversationId), (old) => {
    if (!old) return old; // history not loaded yet — it'll include this message when it loads

    let replaced = false;
    const pages = old.pages.map((page) => ({
      ...page,
      messages: page.messages.map((m) => {
        const same = m.id === message.id || (message.clientId !== null && m.clientId === message.clientId);
        if (!same) return m;
        replaced = true;
        // Never downgrade a confirmed message back to an optimistic one.
        if (m.status === undefined && message.status !== undefined) return m;
        // Once confirmed, keep showing the on-device copy of a photo/voice note (no flash while
        // the server copy loads) but drop the file itself — it's no longer needed for a retry.
        if (message.status === undefined && m.local && !message.local) return { ...message, local: { url: m.local.url } };
        return message;
      }),
    }));

    if (!replaced) {
      // pages[0] is the newest page; new messages go at its end.
      pages[0] = { ...pages[0], messages: [...pages[0].messages, message] };
    }
    return { ...old, pages };
  });
}

/** Update the chat list for a new message: preview, move to top, and unread count. */
export function applyMessageToList(qc: QueryClient, message: Message, myId: string): boolean {
  let found = false;
  qc.setQueryData<Conversation[]>(chatKeys.conversations, (old) => {
    if (!old) return old;
    const current = old.find((c) => c.id === message.conversationId);
    if (!current) return old;
    found = true;

    const isNewer = !current.lastMessage || current.lastMessage.createdAt <= message.createdAt;
    const alreadyCounted = current.lastMessage?.id === message.id;
    const updated: Conversation = {
      ...current,
      lastMessage: isNewer
        ? {
            id: message.id,
            senderId: message.senderId,
            type: message.type,
            preview: previewFor(message.type, message.text),
            createdAt: message.createdAt,
            system: message.system ?? null,
          }
        : current.lastMessage,
      lastMessageAt: isNewer ? message.createdAt : current.lastMessageAt,
      unreadCount:
        message.senderId !== myId && message.type !== 'system' && !alreadyCounted && message.status === undefined
          ? current.unreadCount + 1
          : current.unreadCount,
    };
    return [updated, ...old.filter((c) => c.id !== current.id)];
  });
  return found;
}

/** Someone read a conversation: update their "seen up to" time (and my unread badge if it was me). */
export function applyRead(qc: QueryClient, conversationId: string, userId: string, lastReadAt: string, myId: string) {
  qc.setQueryData<Conversation[]>(chatKeys.conversations, (old) =>
    old?.map((c) =>
      c.id !== conversationId
        ? c
        : {
            ...c,
            unreadCount: userId === myId ? 0 : c.unreadCount,
            members: c.members.map((m) => (m.user.id === userId ? { ...m, lastReadAt } : m)),
          },
    ),
  );
}

/** Add a conversation (e.g. just opened a new chat) or refresh it in the list. */
export function upsertConversation(qc: QueryClient, conversation: Conversation) {
  qc.setQueryData<Conversation[]>(chatKeys.conversations, (old) => {
    if (!old) return [conversation];
    return old.some((c) => c.id === conversation.id)
      ? old.map((c) => (c.id === conversation.id ? conversation : c))
      : [conversation, ...old];
  });
}

/** I left or was removed: drop the conversation and its history from this device. */
export function removeConversation(qc: QueryClient, conversationId: string) {
  qc.setQueryData<Conversation[]>(chatKeys.conversations, (old) => old?.filter((c) => c.id !== conversationId));
  qc.removeQueries({ queryKey: chatKeys.messages(conversationId) });
  qc.removeQueries({ queryKey: ['sharedMedia', conversationId] });
}
