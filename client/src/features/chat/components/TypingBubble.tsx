import { Avatar } from '@/components/ui/Avatar';
import type { UserSummary } from '../types';

// Three bouncing dots in a received-style bubble.
export function TypingBubble({ users }: { users: Array<UserSummary | undefined> }) {
  const first = users.find(Boolean);
  const label =
    users.length > 1 ? `${users.length} people are typing` : `${first?.displayName ?? 'Someone'} is typing`;

  return (
    <div className="mt-3 flex items-end gap-2" aria-live="polite" aria-label={label}>
      <div className="w-7 shrink-0">{first && <Avatar name={first.displayName} src={first.avatarUrl} size={28} />}</div>
      <div className="flex items-center gap-1 rounded-[18px] rounded-bl-[4px] bg-surface-2 px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-2 animate-bounce rounded-full bg-text-secondary/60"
            style={{ animationDelay: `${i * 150}ms`, animationDuration: '1s' }}
          />
        ))}
      </div>
    </div>
  );
}
