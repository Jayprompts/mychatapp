import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Search, UserRoundSearch } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { FormAlert } from '@/components/ui/FormAlert';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { errorMessage } from '@/lib/api';
import { useOpenDirectChat, useUserSearch } from '../api';

export function NewChatDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 250);
  const search = useUserSearch(debounced);
  const openChat = useOpenDirectChat();
  const navigate = useNavigate();

  const close = () => {
    setQuery('');
    openChat.reset();
    onClose();
  };

  const start = (userId: string) =>
    openChat.mutate(userId, {
      onSuccess: (conversation) => {
        close();
        navigate(`/chats/${conversation.id}`);
      },
    });

  return (
    <Modal open={open} onClose={close} title="New message">
      <div className="p-5 pb-3">
        <label className="flex items-center gap-2.5 rounded-full bg-surface-2 px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/30">
          <Search size={17} className="shrink-0 text-text-secondary" aria-hidden />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people by name or @username"
            aria-label="Search people"
            className="w-full bg-transparent text-[15px] text-text-primary outline-none placeholder:text-text-tertiary"
          />
        </label>
      </div>

      {openChat.isError && (
        <div className="px-5 pb-3">
          <FormAlert>{errorMessage(openChat.error)}</FormAlert>
        </div>
      )}

      <div className="px-2 pb-4">
        {!debounced.trim() ? (
          <Hint icon={<UserRoundSearch size={30} strokeWidth={1.5} />} text="Find someone to chat with." />
        ) : search.isPending ? (
          <div className="flex flex-col gap-1 px-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <Skeleton className="size-11 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="mb-2 h-3.5 w-2/5" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : search.isError ? (
          <div className="px-3">
            <FormAlert>{errorMessage(search.error)}</FormAlert>
          </div>
        ) : search.data.length === 0 ? (
          <Hint icon={<Search size={30} strokeWidth={1.5} />} text={`No one found for "${debounced.trim()}".`} />
        ) : (
          <ul>
            {search.data.map((user) => (
              <li key={user.id}>
                <button
                  type="button"
                  onClick={() => start(user.id)}
                  disabled={openChat.isPending}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-bg focus-visible:bg-bg focus-visible:outline-none disabled:opacity-60"
                >
                  <Avatar name={user.displayName} src={user.avatarUrl} size={44} status={user.online ? 'online' : undefined} />
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold text-text-primary">{user.displayName}</span>
                    <span className="block truncate text-[13px] text-text-secondary">@{user.username}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

function Hint({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center text-text-tertiary">
      {icon}
      <p className="text-sm text-text-secondary">{text}</p>
    </div>
  );
}
