import type { MessageType } from './types';

// Same wording as the server's previewFor() (chat list, notifications).
export function previewFor(type: MessageType, text: string): string {
  if (type === 'voice') return '🎤 Voice message';
  if (type === 'image') return text ? `📷 ${text.slice(0, 110)}` : '📷 Photo';
  return text.slice(0, 120);
}
