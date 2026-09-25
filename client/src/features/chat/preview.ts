import type { MessageType, SystemEvent } from './types';

// Same wording as the server's previewFor() (chat list, notifications).
export const DELETED_PREVIEW = 'This message was deleted';
export const EDIT_WINDOW_MS = 15 * 60 * 1000;
export const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

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
  const scope = e.scope ?? 'group';
  switch (e.kind) {
    case 'created':
      return `${actor} created the ${scope} "${e.name}"`;
    case 'added':
      return `${actor} added ${list(e.targets)}`;
    case 'removed':
      return `${actor} removed ${list(e.targets)}`;
    case 'left':
      return `${actor} left the ${scope}`;
    case 'renamed':
      return `${actor} renamed the ${scope} to "${e.name}"`;
    case 'joined':
      return `${actor} joined the ${scope}`;
    case 'role':
      return `${actor} made ${list(e.targets)} ${e.role === 'admin' ? 'an admin' : 'a member'}`;
  }
}
