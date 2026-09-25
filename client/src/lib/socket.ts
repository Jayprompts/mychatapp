import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@/features/chat/types';

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: ChatSocket | null = null;

// One shared connection for the whole app. Same origin (Vite proxy in dev, Nginx in prod),
// so the httpOnly auth cookie is sent with the handshake automatically.
export function getSocket(): ChatSocket {
  socket ??= io({ autoConnect: false, withCredentials: true });
  return socket;
}
