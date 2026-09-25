// Mirrors the server's API + socket shapes (server/src/services/conversationView.ts, models/Message.ts, sockets/events.ts).

export type UserSummary = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  lastSeenAt: string | null;
  online: boolean;
};

export type ConversationMember = {
  user: UserSummary;
  role: 'owner' | 'admin' | 'member';
  lastReadAt: string;
};

export type Conversation = {
  id: string;
  type: 'direct' | 'group';
  name: string;
  avatarUrl: string | null;
  members: ConversationMember[];
  lastMessage: { id: string; senderId: string; type: string; preview: string; createdAt: string } | null;
  lastMessageAt: string;
  unreadCount: number;
  createdAt: string;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  type: 'text';
  text: string;
  clientId: string | null;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  /** Client-only: optimistic messages that haven't been confirmed by the server yet. */
  status?: 'sending' | 'failed';
};

export type MessagesPage = { messages: Message[]; hasMore: boolean; nextCursor: string | null };

// ── Socket events ─────────────────────────────────────────
export type PresencePayload = { userId: string; online: boolean; lastSeenAt: string | null };
export type TypingPayload = { conversationId: string; userId: string; isTyping: boolean };
export type ReadPayload = { conversationId: string; userId: string; lastReadAt: string };

export interface ServerToClientEvents {
  'message:new': (payload: { message: Message }) => void;
  'conversation:read': (payload: ReadPayload) => void;
  'presence:update': (payload: PresencePayload) => void;
  typing: (payload: TypingPayload) => void;
}

export interface ClientToServerEvents {
  typing: (payload: { conversationId: string; isTyping: boolean }) => void;
}
