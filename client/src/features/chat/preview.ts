import type { MessageType, SystemEvent } from './types';

// Same wording as the server's previewFor() (chat list, notifications).
export function previewFor(type: MessageType, text: string): string {
  if (type === 'voice') return '🎤 Voice message';
  if (type === 'image') return text ? `📷 ${text.slice(0, 110)}` : '📷 Photo';
  return text.slice(0, 120);
}

/** Readable line for a group event, saying "You" for the viewer: "You added Ana and Ben". */
export function formatSystemEvent(e: SystemEvent, myId: string): string {
  const who = (p: { id: string; name: string }) => (p.id === myId ? 'You' : p.name);
  const list = (ps: { id: string; name: string }[]) => {
    const n = ps.map(who);
    return n.length <= 2 ? n.join(' and ') : `${n[0]}, ${n[1]} and ${n.length - 2} others`;
  };
  const actor = who(e.actor);
  switch (e.kind) {
    case 'created':
      return `${actor} created the group "${e.name}"`;
    case 'added':
      return `${actor} added ${list(e.targets)}`;
    case 'removed':
      return `${actor} removed ${list(e.targets)}`;
    case 'left':
      return `${actor} left the group`;
    case 'renamed':
      return `${actor} renamed the group to "${e.name}"`;
    case 'role':
      return `${actor} made ${list(e.targets)} ${e.role === 'admin' ? 'an admin' : 'a member'}`;
  }
}
