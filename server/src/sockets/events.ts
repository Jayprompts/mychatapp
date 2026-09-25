import type { PublicMessage } from '../models/Message.js';

// Every real-time event, typed in one place. The client has a mirror of this file.

export type PresencePayload = { userId: string; online: boolean; lastSeenAt: string | null };
export type TypingPayload = { conversationId: string; userId: string; isTyping: boolean };
export type ReadPayload = { conversationId: string; userId: string; lastReadAt: string };
export type NewMessagePayload = { message: PublicMessage };

export interface ServerToClientEvents {
  'message:new': (payload: NewMessagePayload) => void;
  'conversation:read': (payload: ReadPayload) => void;
  'presence:update': (payload: PresencePayload) => void;
  typing: (payload: TypingPayload) => void;
}

export interface ClientToServerEvents {
  typing: (payload: { conversationId: string; isTyping: boolean }) => void;
}

export type SocketData = { userId: string };
