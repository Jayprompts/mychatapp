import { useState } from 'react';
import { Compass, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormAlert } from '@/components/ui/FormAlert';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { useDiscover } from '../api';
import { COMMUNITY_CATEGORIES, type CommunityCategory } from '../types';
import { CommunityCardView } from './CommunityCardView';

const FILTERS = ['All', ...COMMUNITY_CATEGORIES] as const;

export function DiscoverView() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CommunityCategory | 'All'>('All');
  const q = useDebouncedValue(query, 300);
  const discover = useDiscover(q, category);
  const communities = discover.data?.pages.flatMap((p) => p.communities) ?? [];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-col gap-3 border-b border-border bg-card px-4 py-3 sm:px-5">
        <label className="flex items-center gap-2.5 rounded-full bg-surface-2 px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/30">
          <Search size={16} className="shrink-0 text-text-secondary" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search communities…"
            aria-label="Search communities"
            className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary"
          />
        </label>
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5 sm:-mx-5 sm:px-5" role="group" aria-label="Categories">
          {FILTERS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={cn(
                'shrink-0 rounded-full border-[1.5px] px-3.5 py-1 text-[13px] font-semibold transition-colors',
                category === c ? 'gradient-message border-transparent text-white' : 'border-border bg-card text-text-secondary hover:text-text-primary',
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
        {discover.isPending ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="overflow-hidden rounded-lg border border-border bg-card">
                <Skeleton className="h-20 rounded-none" />
                <div className="flex flex-col gap-2 p-3.5">
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-3 w-2/5" />
                  <Skeleton className="h-9 w-24 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : discover.isError ? (
          <FormAlert>{errorMessage(discover.error)}</FormAlert>
        ) : communities.length === 0 ? (
          <EmptyState
            icon={Compass}
            title={q || category !== 'All' ? 'No communities found' : 'No communities yet'}
            description={q || category !== 'All' ? 'Try a different keyword or category.' : 'Be the first — create one and invite your people.'}
          />
        ) : (
          <>
            <div className={cn('grid grid-cols-1 gap-3 transition-opacity sm:grid-cols-2 xl:grid-cols-3', discover.isPlaceholderData && 'opacity-60')}>
              {communities.map((c) => (
                <CommunityCardView key={c.id} community={c} />
              ))}
            </div>
            {discover.hasNextPage && (
              <div className="mt-5 flex justify-center">
                <Button variant="secondary" onClick={() => void discover.fetchNextPage()} loading={discover.isFetchingNextPage}>
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
