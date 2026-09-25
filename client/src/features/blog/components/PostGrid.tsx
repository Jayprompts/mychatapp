import type { ReactNode } from 'react';
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { FormAlert } from '@/components/ui/FormAlert';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import type { PostCard } from '../types';
import { HeroCard, PostCardSkeleton, PostCardView } from './PostCardView';

type Query = UseInfiniteQueryResult<InfiniteData<{ posts: PostCard[]; hasMore: boolean }>>;

// A paged list of post cards: 1 column on phones, 2 on tablets, 3 on wide screens.
// With `hero`, the first post becomes the big featured card on desktop.
export function PostGrid({ query, empty, hero = false }: { query: Query; empty: ReactNode; hero?: boolean }) {
  const posts = query.data?.pages.flatMap((p) => p.posts) ?? [];
  const grid = cn('grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3', query.isPlaceholderData && 'opacity-60 transition-opacity');

  if (query.isPending) {
    return (
      <>
        {hero && <div className="skeleton mb-6 hidden h-80 rounded-3xl lg:block" />}
        <div className={grid}>
          {Array.from({ length: 6 }, (_, i) => (
            <PostCardSkeleton key={i} className={cn(i >= 3 && 'hidden sm:block')} />
          ))}
        </div>
      </>
    );
  }
  if (query.isError) return <FormAlert>{errorMessage(query.error)}</FormAlert>;
  if (posts.length === 0) return <>{empty}</>;

  const [first, ...rest] = posts;
  return (
    <>
      {hero && (
        <div className="mb-6 hidden lg:block">
          <HeroCard post={first} />
        </div>
      )}
      <div className={grid}>
        {hero && (
          <div className="lg:hidden">
            <PostCardView post={first} />
          </div>
        )}
        {(hero ? rest : posts).map((p) => (
          <PostCardView key={p.id} post={p} />
        ))}
      </div>
      {query.hasNextPage && (
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" onClick={() => void query.fetchNextPage()} loading={query.isFetchingNextPage}>
            Load more
          </Button>
        </div>
      )}
    </>
  );
}
