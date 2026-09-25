import { useState, type ReactNode } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/cn';
import type { ConversationMember, Message } from '../types';

type Props = {
  message: Message | null;
  members: Map<string, ConversationMember>;
  myId: string;
  onClose: () => void;
  onRemoveMine: (message: Message) => void;
};

// "Who reacted?" — opened by tapping a reaction pill (per the design).
export function ReactionsSheet({ message, members, myId, onClose, onRemoveMine }: Props) {
  const [filter, setFilter] = useState<string | null>(null);
  const reactions = message?.reactions ?? [];
  const rows = reactions
    .filter((r) => !filter || r.emoji === filter)
    .flatMap((r) => r.userIds.map((userId) => ({ emoji: r.emoji, userId })));
  const total = reactions.reduce((n, r) => n + r.count, 0);

  const close = () => {
    setFilter(null);
    onClose();
  };

  return (
    <Modal open={message !== null} onClose={close} title="Reactions">
      <div className="flex gap-1.5 overflow-x-auto px-5 pt-4 pb-2">
        <Tab active={!filter} onClick={() => setFilter(null)}>
          All {total}
        </Tab>
        {reactions.map((r) => (
          <Tab key={r.emoji} active={filter === r.emoji} onClick={() => setFilter(r.emoji)}>
            {r.emoji} {r.count}
          </Tab>
        ))}
      </div>
      <ul className="px-2 pb-4">
        {rows.map(({ emoji, userId }) => {
          const user = members.get(userId)?.user;
          const isMe = userId === myId;
          return (
            <li key={`${emoji}-${userId}`}>
              <button
                type="button"
                disabled={!isMe}
                onClick={() => {
                  if (message) onRemoveMine(message);
                  close();
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left enabled:hover:bg-bg disabled:cursor-default"
              >
                <Avatar name={user?.displayName ?? 'Former member'} src={user?.avatarUrl} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-text-primary">
                    {isMe ? 'You' : (user?.displayName ?? 'Former member')}
                  </span>
                  {isMe && <span className="block text-xs text-text-secondary">Tap to remove</span>}
                </span>
                <span className="text-[22px]">{emoji}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors',
        active ? 'bg-primary/12 text-primary' : 'bg-surface-2 text-text-secondary hover:text-text-primary',
      )}
    >
      {children}
    </button>
  );
}
