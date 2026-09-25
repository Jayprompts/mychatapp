import type http from 'node:http';
import { Server, type Socket } from 'socket.io';
import { parseCookie } from 'cookie';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { authenticateToken } from '../middleware/auth.js';
import { Conversation } from '../models/Conversation.js';
import { User } from '../models/User.js';
import { addConnection, removeConnection } from '../services/presence.js';
import { AUTH_COOKIE } from '../utils/jwt.js';
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from './events.js';

type GroveServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
type GroveSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

let io: GroveServer | null = null;

// Every user has a private room; emitting to it reaches all their tabs/devices.
export const userRoom = (userId: string) => `user:${userId}`;

export function emitToUsers<E extends keyof ServerToClientEvents>(
  userIds: string[],
  event: E,
  ...args: Parameters<ServerToClientEvents[E]>
) {
  if (!io || userIds.length === 0) return;
  io.to(userIds.map(userRoom)).emit(event, ...args);
}

// Kick every live socket of a user (used by logout-all; bans will use it too).
export function disconnectUser(userId: string) {
  io?.in(userRoom(userId)).disconnectSockets(true);
}

// Same credentials as REST: the httpOnly cookie (web) or a token in the handshake (mobile/Expo).
function tokenFromHandshake(socket: GroveSocket): string | null {
  const auth: unknown = socket.handshake.auth?.token;
  if (typeof auth === 'string' && auth) return auth;
  const cookieHeader = socket.handshake.headers.cookie;
  if (!cookieHeader) return null;
  return parseCookie(cookieHeader)[AUTH_COOKIE] ?? null;
}

// Tell everyone who shares a conversation with this user that they came online / went offline.
async function broadcastPresence(userId: string, online: boolean, lastSeenAt: Date | null) {
  const contacts = await Conversation.distinct('members.user', { 'members.user': userId });
  const others = contacts.map(String).filter((id) => id !== userId);
  emitToUsers(others, 'presence:update', { userId, online, lastSeenAt: lastSeenAt?.toISOString() ?? null });
}

export function initSocket(server: http.Server) {
  io = new Server(server, {
    cors: { origin: env.CLIENT_URL, credentials: true },
  });

  io.use(async (socket, next) => {
    try {
      const token = tokenFromHandshake(socket);
      if (!token) return next(new Error('Not authenticated'));
      const user = await authenticateToken(token);
      socket.data.userId = user._id.toString();
      next();
    } catch {
      next(new Error('Not authenticated'));
    }
  });

  io.on('connection', (socket) => {
    const { userId } = socket.data;
    void socket.join(userRoom(userId));

    if (addConnection(userId)) {
      void broadcastPresence(userId, true, null).catch(console.error);
    }

    // "X is typing…" — relayed to the other members only. Clients throttle how often they send this.
    socket.on('typing', async (payload) => {
      try {
        const conversationId = payload?.conversationId;
        if (typeof conversationId !== 'string' || !mongoose.isValidObjectId(conversationId)) return;
        const conversation = await Conversation.findOne({ _id: conversationId, 'members.user': userId })
          .select('members.user')
          .lean();
        if (!conversation) return;
        const others = conversation.members.map((m) => m.user.toString()).filter((id) => id !== userId);
        emitToUsers(others, 'typing', { conversationId, userId, isTyping: Boolean(payload.isTyping) });
      } catch (err) {
        console.error('typing handler failed:', err);
      }
    });

    socket.on('disconnect', async () => {
      if (!removeConnection(userId)) return; // still connected on another tab/device
      try {
        const lastSeenAt = new Date();
        await User.updateOne({ _id: userId }, { lastSeenAt });
        await broadcastPresence(userId, false, lastSeenAt);
      } catch (err) {
        console.error('disconnect handler failed:', err);
      }
    });
  });

  return io;
}
