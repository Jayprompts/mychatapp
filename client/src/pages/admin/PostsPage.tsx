import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { EyeOff, Heart, MessageSquare, Star, StarOff, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Menu, type MenuItem } from '@/components/ui/Menu';
import { useAdminPosts, useBulkPosts, usePostAction } from '@/features/admin/api';
import { ReasonDialog } from '@/features/admin/components/ReasonDialog';
import { FilterSelect, PageTitle, Pagination, SearchBox, TableCard, td, th } from '@/features/admin/components/ui';
import type { AdminPost } from '@/features/admin/types';
import { PostCover } from '@/features/blog/components/PostCover';
import { TagChip } from '@/features/blog/components/TagChip';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatPostDate } from '@/lib/time';
import { toast } from '@/lib/toast';

type Action = 'feature' | 'unfeature' | 'unpublish' | 'delete';
type Pending = { action: Action; posts: AdminPost[] } | null;

const COPY: Record<Action, { verb: string; body: string; done: string; reason: boolean; danger: boolean }> = {
  feature: { verb: 'Feature', body: 'Featured posts are pinned to the top of the Blog feed.', done: 'featured', reason: false, danger: false },
  unfeature: { verb: 'Unfeature', body: 'It goes back to its normal place in the feed.', done: 'unfeatured', reason: false, danger: false },
  unpublish: { verb: 'Unpublish', body: 'It goes back to the author’s drafts, so they can fix it and publish again. They’re told why (without your name).', done: 'unpublished', reason: true, danger: true },
  delete: { verb: 'Delete', body: 'The post, its comments and likes are deleted for good. The author is told why (without your name).', done: 'deleted', reason: true, danger: true },
};

// /admin/posts — every published post: feature, unfeature, unpublish or delete (alone or in bulk).
export function PostsPage() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const debounced = useDebouncedValue(q, 300);
  const featured = params.get('featured') === 'true' ? 'true' : '';
  const page = Number(params.get('page') ?? 1) || 1;
  const set = (patch: Record<string, string>) =>
    setParams((p) => {
      for (const [k, v] of Object.entries(patch)) {
        if (v) p.set(k, v);
        else p.delete(k);
      }
      if (!('page' in patch)) p.delete('page');
      return p;
    });

  const list = useAdminPosts({ q: debounced || undefined, featured: featured || undefined, page });
  const posts = list.data?.posts ?? [];
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Pending>(null);
  const toggle = (id: string) => setSelected((s) => (s.has(id) ? (s.delete(id), new Set(s)) : new Set(s).add(id)));
  const chosen = posts.filter((p) => selected.has(p.id));

  // Featuring one post is instant (no dialog); everything else confirms first.
  const quick = usePostAction();
  const feature = (p: AdminPost, on: boolean) =>
    quick.mutate({ id: p.id, action: on ? 'feature' : 'unfeature' }, { onSuccess: () => toast(on ? 'Post featured' : 'Post unfeatured'), onError: (e) => toast(errorMessage(e), 'error') });
  const menuFor = (p: AdminPost): MenuItem[] => [
    p.featured
      ? { label: 'Unfeature', icon: <StarOff size={15} />, onSelect: () => feature(p, false) }
      : { label: 'Feature', icon: <Star size={15} />, onSelect: () => feature(p, true) },
    { label: 'Unpublish…', icon: <EyeOff size={15} />, onSelect: () => setPending({ action: 'unpublish', posts: [p] }) },
    { label: 'Delete…', icon: <Trash2 size={15} />, danger: true, onSelect: () => setPending({ action: 'delete', posts: [p] }) },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle title="Blog posts" description={list.data ? `${list.data.total.toLocaleString()} published` : ' '} />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchBox value={q} onChange={(v) => (setQ(v), set({ q: v }))} placeholder="Search title or @author" />
        <FilterSelect label="Featured" value={featured} onChange={(v) => set({ featured: v })} options={[{ value: 'true', label: 'Featured only' }]} />
      </div>

      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-[10px] border border-primary/20 bg-primary/6 px-3 py-2 text-[13px]" role="toolbar" aria-label="Bulk actions">
          <strong className="text-text-primary">{selected.size} selected</strong>
          <span className="text-text-tertiary">—</span>
          <Button size="sm" variant="outline" onClick={() => setPending({ action: 'feature', posts: chosen })}>Feature</Button>
          <Button size="sm" variant="outline" onClick={() => setPending({ action: 'unfeature', posts: chosen })}>Unfeature</Button>
          <Button size="sm" variant="outline" onClick={() => setPending({ action: 'unpublish', posts: chosen })}>Unpublish</Button>
          <Button size="sm" variant="danger-outline" onClick={() => setPending({ action: 'delete', posts: chosen })}>Delete</Button>
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-xs font-semibold text-text-secondary hover:text-text-primary">Cancel</button>
        </div>
      )}

      <TableCard footer={list.data && <Pagination page={page} pageSize={list.data.pageSize} total={list.data.total} onPage={(p) => set({ page: String(p) })} />}>
        <table className={cn('w-full min-w-[760px] border-collapse', list.isPlaceholderData && 'opacity-60')}>
          <thead>
            <tr className="border-b border-border">
              <th className={cn(th, 'w-9')}>
                <input
                  type="checkbox"
                  aria-label="Select all on this page"
                  checked={posts.length > 0 && posts.every((p) => selected.has(p.id))}
                  onChange={(e) => setSelected(e.target.checked ? new Set(posts.map((p) => p.id)) : new Set())}
                />
              </th>
              {['Post', 'Author', 'Tag', 'Published', 'Engagement', ''].map((h) => <th key={h} className={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className={cn('border-b border-row-line last:border-0 hover:bg-row-hover', selected.has(p.id) && 'bg-primary/4')}>
                <td className={td}><input type="checkbox" aria-label={`Select ${p.title}`} checked={selected.has(p.id)} onChange={() => toggle(p.id)} /></td>
                <td className={td}>
                  <Link to={`/blog/${p.id}`} className="flex max-w-sm items-center gap-2.5 hover:underline">
                    <PostCover coverUrl={p.coverUrl} theme={p.coverTheme} className="h-9 w-14 shrink-0 rounded-md" />
                    <span className="line-clamp-2 font-semibold text-text-primary">{p.title}</span>
                    {p.featured && <Star size={14} className="shrink-0 fill-[#F5B400] text-[#F5B400]" aria-label="Featured" />}
                  </Link>
                </td>
                <td className={cn(td, 'whitespace-nowrap text-text-secondary')}>{p.author ? `@${p.author.username}` : 'Deleted user'}</td>
                <td className={td}><TagChip tag={p.tag} /></td>
                <td className={cn(td, 'whitespace-nowrap text-text-secondary')}>{formatPostDate(p.publishedAt)}</td>
                <td className={cn(td, 'whitespace-nowrap text-text-secondary')}>
                  <span className="inline-flex items-center gap-3">
                    <span className="inline-flex items-center gap-1"><Heart size={13} /> {p.likeCount}</span>
                    <span className="inline-flex items-center gap-1"><MessageSquare size={13} /> {p.commentCount}</span>
                  </span>
                </td>
                <td className={cn(td, 'w-10 text-right')}><Menu items={menuFor(p)} label={`Actions for ${p.title}`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.data && posts.length === 0 && <p className="px-4 py-10 text-center text-[13px] text-text-secondary">No posts match these filters.</p>}
        {list.isPending && <p className="px-4 py-10 text-center text-[13px] text-text-secondary">Loading…</p>}
      </TableCard>

      {pending && <PostDialog pending={pending} onClose={() => setPending(null)} onDone={() => setSelected(new Set())} />}
    </div>
  );
}

function PostDialog({ pending, onClose, onDone }: { pending: NonNullable<Pending>; onClose: () => void; onDone: () => void }) {
  const one = usePostAction();
  const bulk = useBulkPosts();
  const c = COPY[pending.action];
  const many = pending.posts.length > 1;
  const what = many ? `${pending.posts.length} posts` : `“${pending.posts[0].title}”`;
  const error = one.error ?? bulk.error;

  const confirm = (reason: string) => {
    const done = (msg: string) => (toast(msg), onDone(), onClose());
    if (many) {
      bulk.mutate(
        { ids: pending.posts.map((p) => p.id), action: pending.action, reason: reason || undefined },
        { onSuccess: (r) => done(r.skipped.length ? `${r.done.length} ${c.done} · skipped ${r.skipped.length}` : `${r.done.length} posts ${c.done}`) },
      );
    } else {
      one.mutate({ id: pending.posts[0].id, action: pending.action, reason }, { onSuccess: () => done(`Post ${c.done}`) });
    }
  };

  return (
    <ReasonDialog
      open
      title={`${c.verb} ${what}?`}
      body={c.body}
      confirmLabel={c.verb}
      withReason={c.reason}
      danger={c.danger}
      loading={one.isPending || bulk.isPending}
      error={error ? errorMessage(error) : null}
      onCancel={onClose}
      onConfirm={confirm}
    />
  );
}
