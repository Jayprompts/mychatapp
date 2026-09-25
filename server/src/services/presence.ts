// In-memory "who is online": userId -> number of open sockets (tabs/devices).
// Fine for a single server process. With several processes (PM2 cluster) this would move to Redis.
const connections = new Map<string, number>();

/** Returns true if this connection made the user go from offline -> online. */
export function addConnection(userId: string): boolean {
  const count = (connections.get(userId) ?? 0) + 1;
  connections.set(userId, count);
  return count === 1;
}

/** Returns true if this disconnect made the user go from online -> offline. */
export function removeConnection(userId: string): boolean {
  const count = (connections.get(userId) ?? 0) - 1;
  if (count <= 0) {
    connections.delete(userId);
    return true;
  }
  connections.set(userId, count);
  return false;
}

export function isOnline(userId: string): boolean {
  return connections.has(userId);
}
