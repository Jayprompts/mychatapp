import { useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { cn } from '@/lib/cn';
import { useUserSearch } from '../api';
import type { UserSummary } from '../types';

type Props = {
  selected: UserSummary[];
  onChange: (next: UserSummary[]) => void;
  alreadyIn?: Set<string>; // shown greyed out as "Already in group"
  autoFocus?: boolean;
};

// Search + multi-select with removable chips (the design's "Add People" pattern).
export function PeoplePicker({ selected, onChange, alreadyIn, autoFocus }: Props) {
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 250);
  const search = useUserSearch(debounced);
  const selectedIds = new Set(selected.map((u) => u.id));

  const toggle = (user: UserSummary) =>
    onChange(selectedIds.has(user.id) ? selected.filter((u) => u.id !== user.id) : [...selected, user]);

  return (
    <div className="flex flex-col">
      <div className="px-5 pt-4 pb-3">
        {selected.length > 0 && (
          <ul className="mb-3 flex flex-wrap gap-1.5" aria-label="Selected people">
            {selected.map((u) => (
              <li
                key={u.id}
                className="flex items-center gap-1.5 rounded-full border-[1.5px] border-primary/25 bg-primary/10 py-1 pr-2 pl-1"
              >
                <Avatar name={u.displayName} src={u.avatarUrl} size={20} />
                <span className="text-[13px] font-semibold text-primary">{u.displayName.split(' ')[0]}</span>
                <button type="button" onClick={() => toggle(u)} aria-label={`Remove ${u.displayName}`} className="text-primary">
                  <X size={13} strokeWidth={2.5} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <label className="flex items-center gap-2.5 rounded-full bg-surface-2 px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/30">
          <Search size={16} className="shrink-0 text-text-secondary" aria-hidden />
          <input
            autoFocus={autoFocus}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people by name or @username"
            aria-label="Search people"
            className="w-full bg-transparent text-[15px] text-text-primary outline-none placeholder:text-text-tertiary"
          />
        </label>
      </div>

      <div className="min-h-40 px-2 pb-3">
        {!debounced.trim() ? (
          <p className="px-4 py-8 text-center text-sm text-text-secondary">Search for people to add.</p>
        ) : search.isPending ? (
          <div className="flex flex-col gap-1 px-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <Skeleton className="size-10 rounded-full" />
                <Skeleton className="h-3.5 w-2/5" />
              </div>
            ))}
          </div>
        ) : !search.data?.length ? (
          <p className="px-4 py-8 text-center text-sm text-text-secondary">No one found for &quot;{debounced.trim()}&quot;.</p>
        ) : (
          <ul>
            {search.data.map((user) => {
              const inGroup = alreadyIn?.has(user.id) ?? false;
              const checked = selectedIds.has(user.id);
              return (
                <li key={user.id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={checked || inGroup}
                    disabled={inGroup}
                    onClick={() => toggle(user)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-bg focus-visible:bg-bg focus-visible:outline-none disabled:cursor-default disabled:opacity-45"
                  >
                    <Avatar name={user.displayName} src={user.avatarUrl} size={40} status={user.online ? 'online' : undefined} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-text-primary">{user.displayName}</span>
                      <span className="block truncate text-[13px] text-text-secondary">
                        {inGroup ? 'Already in group' : `@${user.username}`}
                      </span>
                    </span>
                    <span
                      className={cn(
                        'flex size-[22px] shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                        checked || inGroup ? 'border-primary bg-primary-solid text-white' : 'border-border',
                      )}
                      aria-hidden
                    >
                      {(checked || inGroup) && <Check size={13} strokeWidth={3} />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
