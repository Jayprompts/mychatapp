import { Link } from 'react-router';
import { Heart, MessageCircle } from 'lucide-react';
import { formatListTime, formatPostDate } from '@/lib/time';
import type { PostCard } from '../types';
import { PostCover } from './PostCover';

// A post as one compact line (profile tabs, per the design).
export function PostRow({ post: p }: { post: PostCard }) {
  const draft = p.status === 'draft';
  return (
    <Link
      to={draft ? `/blog/write/${p.id}` : `/blog/${p.id}`}
      className="flex items-center gap-3 rounded-[14px] border border-border bg-card px-3.5 py-3 transition-colors hover:bg-bg focus-visible:outline-2 focus-visible:outline-primary"
    >
      <PostCover coverUrl={p.coverUrl} theme={p.coverTheme} className="size-11 rounded-[10px]" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text-primary">{p.title || 'Untitled draft'}</p>
        <p className="mt-0.5 flex items-center gap-3 text-xs text-text-secondary">
          {draft ? (
            <span className="rounded-full bg-warning/15 px-2 font-semibold text-warning-ink">Draft · edited {formatListTime(p.updatedAt)}</span>
          ) : (
            <>
              <span>{formatPostDate(p.publishedAt ?? p.updatedAt)}</span>
              <span className="flex items-center gap-1"><Heart size={12} /> {p.likeCount}</span>
              <span className="flex items-center gap-1"><MessageCircle size={12} /> {p.commentCount}</span>
            </>
          )}
        </p>
      </div>
    </Link>
  );
}
