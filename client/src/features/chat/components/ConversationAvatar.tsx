import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/cn';
import { usePresence } from '../liveState';
import type { Conversation } from '../types';

// Direct chat: the other person's avatar + online dot.
// Group: two overlapping member avatars (the design's avatar stack).
export function ConversationAvatar({
  conversation,
  myId,
  size = 52,
  className,
}: {
  conversation: Conversation;
  myId?: string;
  size?: number;
  className?: string;
}) {
  const others = conversation.members.filter((m) => m.user.id !== myId).map((m) => m.user);
  const other = conversation.type === 'direct' ? others[0] : undefined;
  const presence = usePresence(other);

  if (conversation.type === 'direct') {
    return (
      <Avatar
        name={conversation.name}
        src={conversation.avatarUrl}
        size={size}
        status={presence.online ? 'online' : undefined}
        className={className}
      />
    );
  }

  const [a, b] = others;
  const small = Math.round(size * 0.68);
  if (!b) return <Avatar name={a?.displayName ?? conversation.name} src={a?.avatarUrl} size={size} className={className} />;

  return (
    <span className={cn('relative inline-block shrink-0', className)} style={{ width: size, height: size }} aria-label={conversation.name}>
      <span className="absolute top-0 right-0">
        <Avatar name={b.displayName} src={b.avatarUrl} size={small} />
      </span>
      <span className="absolute bottom-0 left-0 flex rounded-full ring-2 ring-card">
        <Avatar name={a.displayName} src={a.avatarUrl} size={small} />
      </span>
    </span>
  );
}
