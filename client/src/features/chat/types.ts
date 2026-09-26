import type { AppNotification } from '@/features/notifications/types';
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

export type ConversationCommunity = {
  id: string;
  icon: string;
  theme: 'grove' | 'ocean' | 'sunset' | 'forest' | 'berry' | 'night';
  visibility: 'public' | 'private';
  category: string;
  coverUrl: string | null;
};

export type Conversation = {
  id: string;
  type: 'direct' | 'group' | 'community';
  community: ConversationCommunity | null; // community chats only
  blocked: 'byMe' | 'byThem' | null; // 1-on-1 chats: who blocked whom
  name: string;
  avatarUrl: string | null;
  description: string; // groups only
  myRole: 'owner' | 'admin' | 'member';
  members: ConversationMember[];
  lastMessage: {
    id: string;
    senderId: string;
    type: string;
    preview: string;
    createdAt: string;
    system?: SystemEvent | null;
  } | null;
  lastMessageAt: string;
  unreadCount: number;
  createdAt: string;
};

export type MessageType = 'text' | 'voice' | 'image' | 'system';

export type PersonRef = { id: string; name: string };

/** Group events shown as centered lines: "Jay added Ana". */
export type SystemEvent = {
  kind: 'created' | 'added' | 'removed' | 'left' | 'renamed' | 'role' | 'joined';
  scope?: 'group' | 'community';
  actor: PersonRef;
  targets: PersonRef[];
  name: string | null;
  role: string | null;
};

export type MessageMedia = {
  url: string; // /api/media/:messageId — only works for conversation members
  mimeType: string;
  size: number;
  durationMs: number | null; // voice
  waveform: number[] | null; // voice: ~48 bars, 0..1
  width: number | null; // image
  height: number | null; // image
};

export type ReplyQuote = { id: string; senderId: string; type: string; preview: string; deleted: boolean };
export type ReactionSummary = { emoji: string; count: number; userIds: string[] };

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  text: string; // message text, or photo caption
  media: MessageMedia | null;
  system?: SystemEvent | null;
  replyTo?: ReplyQuote | null;
  reactions?: ReactionSummary[];
  clientId: string | null;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  /** Client-only: optimistic messages that haven't been confirmed by the server yet. */
  status?: 'sending' | 'failed' | 'queued'; // queued = failed because we were offline; re-sent on reconnect
  /** Client-only: the file on this device (instant preview, upload progress, retry). */
  local?: { url: string; blob?: Blob; progress?: number };
};

export type MessagesPage = { messages: Message[]; hasMore: boolean; nextCursor: string | null };

// ── Socket events ─────────────────────────────────────────
export type PresencePayload = { userId: string; online: boolean; lastSeenAt: string | null };
export type TypingPayload = { conversationId: string; userId: string; isTyping: boolean };
export type ReadPayload = { conversationId: string; userId: string; lastReadAt: string };

export interface ServerToClientEvents {
  'message:new': (payload: { message: Message }) => void;
  'message:updated': (payload: { message: Message }) => void;
  'conversation:read': (payload: ReadPayload) => void;
  'presence:update': (payload: PresencePayload) => void;
  typing: (payload: TypingPayload) => void;
  'conversation:updated': (payload: { conversationId: string }) => void;
  'conversation:removed': (payload: { conversationId: string }) => void;
  'community:updated': (payload: { communityId: string }) => void;
  'post:comments': (payload: { postId: string }) => void; // someone commented on the post I'm reading
  'notification:new': (payload: { notification: AppNotification; unreadCount: number }) => void;
  'notifications:changed': (payload: { unreadCount: number }) => void;
}

export interface ClientToServerEvents {
  typing: (payload: { conversationId: string; isTyping: boolean }) => void;
  'post:watch': (payload: { postId: string }) => void;
  'post:unwatch': (payload: { postId: string }) => void;
}
