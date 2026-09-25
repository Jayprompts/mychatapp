import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Bookmark, Layers, PenLine, Plus } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { buttonClasses } from '@/components/ui/buttonClasses';
import { useMyPosts, usePostFeed, useSavedPosts } from '@/features/blog/api';
import { PostGrid } from '@/features/blog/components/PostGrid';
import { SearchButton } from '@/features/search/SearchButton';
import { POST_TAGS, type FeedSort, type PostTag } from '@/features/blog/types';
import { cn } from '@/lib/cn';

type Tab = 'feed' | 'saved' | 'mine';
const TABS: { id: Tab; label: string }[] = [
  { id: 'feed', label: 'Feed' },
  { id: 'saved', label: 'Saved' },
  { id: 'mine', label: 'My posts' },
];
const SORTS: { id: FeedSort; label: string }[] = [
  { id: 'latest', label: 'Latest' },
  { id: 'liked', label: 'Most liked' },
  { id: 'trending', label: 'Trending' },
];

const chip = (active: boolean) =>
  cn(
    'h-8 shrink-0 rounded-full border-[1.5px] px-3.5 text-[13px] font-semibold whitespace-nowrap transition-colors',
    active ? 'gradient-brand border-transparent text-white shadow-brand' : 'border-border bg-card text-text-secondary hover:text-text-primary',
  );

// Tablet+ only (phones get the floating button). The wrapper hides it: the button's own inline-flex would win over `hidden`.
const writeLink = (
  <span className="hidden sm:block">
    <Link to="/blog/write" className={buttonClasses({ size: 'sm' })}>
      <Plus size={16} strokeWidth={2.4} /> Write post
    </Link>
  </span>
);

// /blog?tab=feed|saved|mine — the feed (per the design: Latest · Most liked · Trending), saved posts, my posts.
export function BlogPage() {
  const [params, setParams] = useSearchParams();
  const tab = (TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'feed') as Tab;

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
          <h1 className="flex items-center gap-2.5 text-[22px] font-bold tracking-tight text-text-primary">
            <span className="gradient-brand flex size-8 items-center justify-center rounded-[10px] text-white" aria-hidden>
              <Layers size={17} />
            </span>
            Blog
          </h1>
          <div className="flex items-center gap-1">
            <SearchButton variant="header" />
            {writeLink}
          </div>
        </div>
        <nav aria-label="Blog sections" className="flex gap-5 px-4 sm:px-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-current={tab === t.id ? 'page' : undefined}
              onClick={() => setParams(t.id === 'feed' ? {} : { tab: t.id })}
              className={cn(
                'border-b-2 pb-2.5 text-sm font-semibold transition-colors',
                tab === t.id ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary',
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 p-4 pb-24 sm:p-6">
        {tab === 'feed' ? <Feed /> : tab === 'saved' ? <Saved /> : <Mine />}
      </div>

      {/* Phones: floating write button, above the tab bar */}
      <Link
        to="/blog/write"
        aria-label="Write a post"
        className="gradient-brand fixed right-5 bottom-[calc(80px+env(safe-area-inset-bottom))] z-30 flex size-14 items-center justify-center rounded-full text-white shadow-[0_6px_20px_rgba(8,102,255,0.35)] transition-transform active:scale-95 sm:hidden"
      >
        <PenLine size={22} />
      </Link>
    </div>
  );
}

function Feed() {
  const [sort, setSort] = useState<FeedSort>('latest');
  const [tag, setTag] = useState<PostTag | 'All'>('All');
  const feed = usePostFeed(sort, tag);
  const filtered = sort !== 'latest' || tag !== 'All';

  return (
    <>
      <div className="-mx-4 mb-5 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="toolbar" aria-label="Sort and filter">
        {SORTS.map((s) => (
          <button key={s.id} type="button" aria-pressed={sort === s.id} onClick={() => setSort(s.id)} className={chip(sort === s.id)}>
            {s.label}
          </button>
        ))}
        <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />
        {(['All', ...POST_TAGS] as const).map((t) => (
          <button key={t} type="button" aria-pressed={tag === t} onClick={() => setTag(t)} className={chip(tag === t)}>
            {t}
          </button>
        ))}
      </div>
      <PostGrid
        query={feed}
        hero={sort === 'latest' && tag === 'All'}
        empty={
          <EmptyState
            icon={Layers}
            title={filtered ? 'Nothing here yet' : 'No posts yet'}
            description={
              sort === 'trending' && tag === 'All'
                ? 'Nothing has taken off in the last two weeks. Like and comment to get things going.'
                : filtered
                  ? 'No posts match this filter yet — be the first to write one.'
                  : 'Be the first to share something with the community. Your ideas belong here.'
            }
            action={
              <Link to="/blog/write" className={buttonClasses()}>
                Write the first post
              </Link>
            }
          />
        }
      />
    </>
  );
}

function Saved() {
  return (
    <PostGrid
      query={useSavedPosts()}
      empty={<EmptyState icon={Bookmark} title="No saved posts yet" description="Tap the bookmark on any post to keep it here for later." />}
    />
  );
}

function Mine() {
  return (
    <PostGrid
      query={useMyPosts()}
      empty={
        <EmptyState
          icon={PenLine}
          title="You haven't written anything yet"
          description="Drafts save automatically while you write, so you can finish later."
          action={
            <Link to="/blog/write" className={buttonClasses()}>
              Write a post
            </Link>
          }
        />
      }
    />
  );
}
