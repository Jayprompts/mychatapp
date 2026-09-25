import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, ChevronRight, Search, UserRoundSearch, Users } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { FormAlert } from '@/components/ui/FormAlert';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { errorMessage } from '@/lib/api';
import { useCreateGroup, useOpenDirectChat, useUserSearch } from '../api';
import type { UserSummary } from '../types';
import { PeoplePicker } from './PeoplePicker';

type Mode = 'direct' | 'group';

export function NewChatDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<Mode>('direct');
  const navigate = useNavigate();

  const close = () => {
    setMode('direct');
    onClose();
  };
  const goTo = (conversationId: string) => {
    close();
    navigate(`/chats/${conversationId}`);
  };

  return (
    <Modal open={open} onClose={close} title={mode === 'group' ? 'New group' : 'New message'}>
      {mode === 'group' ? (
        <NewGroup onBack={() => setMode('direct')} onCreated={goTo} />
      ) : (
        <NewDirect onNewGroup={() => setMode('group')} onOpened={goTo} />
      )}
    </Modal>
  );
}

function NewDirect({ onNewGroup, onOpened }: { onNewGroup: () => void; onOpened: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 250);
  const search = useUserSearch(debounced);
  const openChat = useOpenDirectChat();

  const start = (userId: string) => openChat.mutate(userId, { onSuccess: (c) => onOpened(c.id) });

  return (
    <>
      <div className="p-5 pb-2">
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

      {/* Entry point to create a group */}
      <div className="px-2">
        <button
          type="button"
          onClick={onNewGroup}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-bg focus-visible:bg-bg focus-visible:outline-none"
        >
          <span className="gradient-brand flex size-11 items-center justify-center rounded-full text-white">
            <Users size={20} />
          </span>
          <span className="flex-1 text-[15px] font-semibold text-text-primary">New group</span>
          <ChevronRight size={18} className="text-text-tertiary" aria-hidden />
        </button>
      </div>

      {openChat.isError && (
        <div className="px-5 pt-2">
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
    </>
  );
}

function NewGroup({ onBack, onCreated }: { onBack: () => void; onCreated: (id: string) => void }) {
  const [people, setPeople] = useState<UserSummary[]>([]);
  const [name, setName] = useState('');
  const create = useCreateGroup();
  const canCreate = people.length > 0 && name.trim().length > 0;

  const submit = () =>
    create.mutate(
      { name: name.trim(), memberIds: people.map((p) => p.id) },
      { onSuccess: (conversation) => onCreated(conversation.id) },
    );

  return (
    <div className="flex flex-col">
      <div className="px-5 pt-4">
        <button type="button" onClick={onBack} className="mb-3 flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <ArrowLeft size={16} /> Back
        </button>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-text-secondary">Group name</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder="e.g. Design Guild"
            className="w-full rounded-md border-[1.5px] border-border bg-card px-4 py-2.5 text-[15px] text-text-primary outline-none placeholder:text-text-tertiary focus:border-primary focus:shadow-[0_0_0_3px_rgba(8,102,255,0.15)]"
          />
        </label>
      </div>

      <PeoplePicker selected={people} onChange={setPeople} />

      <div className="sticky bottom-0 border-t border-border bg-card px-5 py-4">
        {create.isError && (
          <div className="mb-3">
            <FormAlert>{errorMessage(create.error)}</FormAlert>
          </div>
        )}
        <Button fullWidth onClick={submit} disabled={!canCreate} loading={create.isPending}>
          {people.length === 0 ? 'Pick people to add' : `Create group · ${people.length + 1} people`}
        </Button>
      </div>
    </div>
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
