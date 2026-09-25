import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import { ArrowLeft, Clock, FileText, MessageCircle, Search, SearchX, Users, X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { PostCover } from '@/features/blog/components/PostCover';
import type { PostCard } from '@/features/blog/types';
import { ConversationAvatar } from '@/features/chat/components/ConversationAvatar';
import type { UserSummary } from '@/features/chat/types';
import { useMe } from '@/features/auth/api';
import { CommunityAvatar } from '@/features/communities/components/CommunityAvatar';
import type { CommunityCard } from '@/features/communities/types';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { useStore } from '@/lib/store';
import { formatListTime, formatPostDate } from '@/lib/time';
import {
  SEARCH_TABS,
  clearRecentSearches,
  closeSearch,
  recentSearches,
  rememberSearch,
  searchOpenStore,
  useSearch,
  type MessageHit,
  type SearchTab,
} from './api';
import { Highlight } from './Highlight';

const LABELS: Record<SearchTab, string> = { top: 'Top', people: 'People', messages: 'Messages', posts: 'Posts', communities: 'Communities' };

// Global search (per the design): one input, tabbed results — full screen on phones, a big panel on desktop.
export function SearchOverlay() {
  const open = useStore(searchOpenStore, (s) => s !== null);
  if (!open) return null;
  return createPortal(<Panel />, document.body);
}

function Panel() {
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<SearchTab>('top');
  const [recent, setRecent] = useState(recentSearches);
  const debounced = useDebouncedValue(q, 250);
  const results = useSearch(debounced, tab);
  const input = useRef<HTMLInputElement>(null);
  const term = debounced.trim();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeSearch();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  // Opening a result: remember what was searched, then close.
  const done = () => {
    rememberSearch(q);
    closeSearch();
  };

  return (
    <div className="fixed inset-0 z-[70] flex justify-center bg-black/45 backdrop-blur-[2px] sm:items-start sm:p-6 sm:pt-[8vh]" onMouseDown={closeSearch}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        onMouseDown={(e) => e.stopPropagation()}
        className="flex h-dvh w-full flex-col bg-card sm:h-auto sm:max-h-[80dvh] sm:max-w-2xl sm:overflow-hidden sm:rounded-2xl sm:shadow-modal"
      >
        <div className="flex items-center gap-2 border-b border-border px-3 py-3 sm:px-4">
          <button type="button" onClick={closeSearch} aria-label="Close search" className="flex size-9 shrink-0 items-center justify-center rounded-full text-text-primary hover:bg-bg sm:hidden">
            <ArrowLeft size={20} />
          </button>
          <label className="flex flex-1 items-center gap-2.5 rounded-full bg-surface-2 px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/30">
            <Search size={17} className="shrink-0 text-text-secondary" aria-hidden />
            <input
              ref={input}
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && rememberSearch(q)}
              placeholder="Search people, messages, posts, communities"
              aria-label="Search"
              className="w-full bg-transparent text-[15px] text-text-primary outline-none placeholder:text-text-tertiary"
            />
            {q && (
              <button type="button" onClick={() => (setQ(''), input.current?.focus())} aria-label="Clear search" className="text-text-secondary hover:text-text-primary">
                <X size={16} />
              </button>
            )}
          </label>
          <kbd className="hidden rounded-md border border-border px-1.5 py-0.5 text-[11px] text-text-secondary sm:block">Esc</kbd>
        </div>

        <nav aria-label="Result types" className="flex shrink-0 gap-1 overflow-x-auto border-b border-border px-3 sm:px-4">
          {SEARCH_TABS.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                '-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm transition-colors',
                tab === t ? 'border-primary font-bold text-primary' : 'border-transparent font-medium text-text-secondary hover:text-text-primary',
              )}
            >
              {LABELS[t]}
            </button>
          ))}
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto pb-4 sm:min-h-[320px]">
          {term.length < 2 ? (
            <Recent
              items={recent}
              onPick={(r) => (setQ(r), input.current?.focus())}
              onClear={() => (clearRecentSearches(), setRecent([]))}
            />
          ) : results.isPending ? (
            <Loading />
          ) : results.isError ? (
            <p className="p-6 text-center text-sm text-error">{errorMessage(results.error)}</p>
          ) : (
            <Results data={results.data} q={term} tab={tab} onTab={setTab} onOpen={done} stale={results.isPlaceholderData} />
          )}
        </div>
      </div>
    </div>
  );
}

function Recent({ items, onPick, onClear }: { items: string[]; onPick: (q: string) => void; onClear: () => void }) {
  if (!items.length) {
    return <p className="px-6 py-10 text-center text-sm text-text-secondary">Find people, messages from your chats, posts and communities.</p>;
  }
  return (
    <section className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[11px] font-bold tracking-[0.08em] text-text-secondary uppercase">Recent</h3>
        <button type="button" onClick={onClear} className="text-xs font-semibold text-primary hover:underline">
          Clear
        </button>
      </div>
      <ul className="flex flex-wrap gap-2">
        {items.map((r) => (
          <li key={r}>
            <button type="button" onClick={() => onPick(r)} className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[13px] text-text-primary hover:bg-bg">
              <Clock size={13} className="text-text-secondary" /> {r}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Loading() {
  return (
    <div className="flex flex-col gap-4 p-4">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="mt-2 h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

type ResultsProps = {
  data: NonNullable<ReturnType<typeof useSearch>['data']>;
  q: string;
  tab: SearchTab;
  onTab: (t: SearchTab) => void;
  onOpen: () => void;
  stale: boolean;
};

function Results({ data, q, tab, onTab, onOpen, stale }: ResultsProps) {
  const { data: me } = useMe();
  const sections: { key: Exclude<SearchTab, 'top'>; icon: typeof Users; items: ReactNode[] }[] = [
    { key: 'people', icon: Users, items: (data.people ?? []).map((u) => <PersonRow key={u.id} u={u} q={q} onOpen={onOpen} />) },
    { key: 'messages', icon: MessageCircle, items: (data.messages ?? []).map((m) => <MessageRow key={m.id} m={m} q={q} myId={me?.id} onOpen={onOpen} />) },
    { key: 'posts', icon: FileText, items: (data.posts ?? []).map((p) => <PostRow key={p.id} p={p} q={q} onOpen={onOpen} />) },
    { key: 'communities', icon: Users, items: (data.communities ?? []).map((c) => <CommunityRow key={c.id} c={c} q={q} onOpen={onOpen} />) },
  ];
  const shown = sections.filter((s) => (tab === 'top' || tab === s.key) && s.items.length);

  if (!shown.length) {
    return (
      <div className={cn('flex flex-col items-center px-8 py-12 text-center', stale && 'opacity-60')}>
        <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary/8 text-primary">
          <SearchX size={24} />
        </span>
        <p className="text-base font-bold text-text-primary">No results for “{q}”</p>
        <p className="mt-1 text-[13px] text-text-secondary">Check the spelling, or try another tab.</p>
      </div>
    );
  }
  return (
    <div className={cn(stale && 'opacity-60 transition-opacity')}>
      {shown.map((s) => (
        <section key={s.key} aria-label={LABELS[s.key]} className="pt-2">
          {tab === 'top' && (
            <div className="flex items-center justify-between px-4 pt-2 pb-1">
              <h3 className="text-[11px] font-bold tracking-[0.08em] text-text-secondary uppercase">{LABELS[s.key]}</h3>
              <button type="button" onClick={() => onTab(s.key)} className="text-xs font-semibold text-primary hover:underline">
                See all
              </button>
            </div>
          )}
          <ul>{s.items}</ul>
        </section>
      ))}
    </div>
  );
}

const row = 'flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-bg focus-visible:bg-bg focus-visible:outline-none';

function PersonRow({ u, q, onOpen }: { u: UserSummary; q: string; onOpen: () => void }) {
  return (
    <li>
      <Link to={`/u/${u.username}`} onClick={onOpen} className={row}>
        <Avatar name={u.displayName} src={u.avatarUrl} size={40} status={u.online ? 'online' : undefined} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-text-primary"><Highlight text={u.displayName} q={q} /></span>
          <span className="block truncate text-xs text-text-secondary">@<Highlight text={u.username} q={q} /></span>
        </span>
      </Link>
    </li>
  );
}

function MessageRow({ m, q, myId, onOpen }: { m: MessageHit; q: string; myId?: string; onOpen: () => void }) {
  const c = m.conversation;
  const href = `${c.community ? `/communities/${c.community.id}` : `/chats/${c.id}`}?m=${m.id}`;
  const who = m.sender?.id === myId ? 'You' : (m.sender?.displayName.split(' ')[0] ?? 'Someone');
  return (
    <li>
      <Link to={href} onClick={onOpen} className={row}>
        <ConversationAvatar conversation={c} myId={myId} size={40} />
        <span className="min-w-0 flex-1">
          <span className="flex justify-between gap-2">
            <span className="truncate text-sm font-semibold text-text-primary">{c.name}</span>
            <span className="shrink-0 text-[11px] text-text-secondary">{formatListTime(m.createdAt)}</span>
          </span>
          <span className="line-clamp-2 text-[13px] text-text-secondary">
            {c.type !== 'direct' || who === 'You' ? `${who}: ` : ''}
            {m.type === 'image' && '📷 '}
            <Highlight text={m.text} q={q} around={40} />
          </span>
        </span>
      </Link>
    </li>
  );
}

function PostRow({ p, q, onOpen }: { p: PostCard; q: string; onOpen: () => void }) {
  return (
    <li>
      <Link to={`/blog/${p.id}`} onClick={onOpen} className={row}>
        <PostCover coverUrl={p.coverUrl} theme={p.coverTheme} className="size-11 rounded-[10px]" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-text-primary"><Highlight text={p.title} q={q} /></span>
          <span className="block truncate text-xs text-text-secondary">
            {p.author?.displayName ?? 'Deleted user'} · {formatPostDate(p.publishedAt ?? p.updatedAt)}
            {p.excerpt && <> · <Highlight text={p.excerpt} q={q} around={30} /></>}
          </span>
        </span>
      </Link>
    </li>
  );
}

function CommunityRow({ c, q, onOpen }: { c: CommunityCard; q: string; onOpen: () => void }) {
  return (
    <li>
      <Link to={`/communities/${c.id}`} onClick={onOpen} className={row}>
        <CommunityAvatar icon={c.icon} theme={c.theme} size={40} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-text-primary"><Highlight text={c.name} q={q} /></span>
          <span className="block truncate text-xs text-text-secondary">
            {c.memberCount.toLocaleString()} {c.memberCount === 1 ? 'member' : 'members'} · {c.category}
            {c.visibility === 'private' && ' · Private'}
            {c.myStatus === 'member' && ' · Joined'}
          </span>
        </span>
      </Link>
    </li>
  );
}
