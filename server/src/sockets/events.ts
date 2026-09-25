import type { PublicMessage } from '../models/Message.js';

// Every real-time event, typed in one place. The client has a mirror of this file.

export type PresencePayload = { userId: string; online: boolean; lastSeenAt: string | null };
export type TypingPayload = { conversationId: string; userId: string; isTyping: boolean };
export type ReadPayload = { conversationId: string; userId: string; lastReadAt: string };
export type NewMessagePayload = { message: PublicMessage };

export interface ServerToClientEvents {
  'message:new': (payload: NewMessagePayload) => void;
  'message:updated': (payload: NewMessagePayload) => void; // reactions, edits, unsends
  'conversation:read': (payload: ReadPayload) => void;
  'presence:update': (payload: PresencePayload) => void;
  typing: (payload: TypingPayload) => void;
  'conversation:updated': (payload: { conversationId: string }) => void; // refetch its details
  'conversation:removed': (payload: { conversationId: string }) => void; // you're no longer a member
  'community:updated': (payload: { communityId: string }) => void; // refetch (requests, approvals, edits)
  'post:comments': (payload: { postId: string }) => void; // to people viewing the post: refetch comments
}

export interface ClientToServerEvents {
  typing: (payload: { conversationId: string; isTyping: boolean }) => void;
  'post:watch': (payload: { postId: string }) => void; // I'm reading this post — send me its comment updates
  'post:unwatch': (payload: { postId: string }) => void;
}

export type SocketData = { userId: string };
