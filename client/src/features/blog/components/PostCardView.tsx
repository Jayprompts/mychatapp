import { Link } from 'react-router';
import { Heart, MessageCircle } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import { formatListTime, formatPostDate } from '@/lib/time';
import { authorName } from '../format';
import type { PostCard } from '../types';
import { BookmarkButton, CommentCount, LikeButton } from './PostActions';
import { PostCover } from './PostCover';
import { TagChip } from './TagChip';

const cardLink =
  'group flex flex-col overflow-hidden rounded-[20px] border border-border bg-card shadow-card transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_32px_rgba(0,0,0,0.1)] focus-visible:outline-2 focus-visible:outline-primary';

const dateOf = (p: PostCard) => (p.status === 'draft' ? `Edited ${formatListTime(p.updatedAt)}` : formatPostDate(p.publishedAt ?? p.updatedAt));

export function PostCardView({ post: p }: { post: PostCard }) {
  const published = p.status === 'published';
  return (
    <Link to={published ? `/blog/${p.id}` : `/blog/${p.id}/edit`} className={cardLink}>
      <PostCover coverUrl={p.coverUrl} theme={p.coverTheme} className="h-40 sm:h-44">
        {!published && (
          <span className="absolute top-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white uppercase">Draft</span>
        )}
      </PostCover>
      <div className="flex flex-1 flex-col gap-2 px-4 pt-3.5 pb-3 sm:px-5">
        <div className="flex items-center justify-between">
          <TagChip tag={p.tag} />
          <span className="text-[11px] text-text-secondary">{p.readMinutes} min read</span>
        </div>
        <h3 className="line-clamp-2 text-[16px] leading-snug font-bold text-text-primary sm:text-[17px]">{p.title || 'Untitled draft'}</h3>
        {p.excerpt && <p className="line-clamp-2 text-sm leading-relaxed text-text-secondary">{p.excerpt}</p>}
        <div className="mt-auto flex items-center gap-2.5 pt-1.5">
          <Avatar name={authorName(p)} src={p.author?.avatarUrl ?? null} size={28} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-text-primary">{authorName(p)}</p>
            <p className="text-[11px] text-text-secondary">{dateOf(p)}</p>
          </div>
          {published && (
            <div className="flex items-center">
              <LikeButton post={p} />
              <CommentCount count={p.commentCount} />
              <BookmarkButton post={p} />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// Desktop feed: the top post as a wide hero (per the design).
export function HeroCard({ post: p }: { post: PostCard }) {
  return (
    <Link
      to={`/blog/${p.id}`}
      className="group relative block h-80 overflow-hidden rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.14)] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-primary"
    >
      <div className="absolute inset-0">
        <PostCover coverUrl={p.coverUrl} theme={p.coverTheme} className="size-full" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-7">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-card/90">
            <TagChip tag={p.tag} />
          </span>
          {p.featured && <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold text-white">Featured</span>}
        </div>
        <h2 className="mt-2.5 line-clamp-2 max-w-3xl text-[26px] leading-tight font-bold text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.3)]">{p.title}</h2>
        {p.excerpt && <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-relaxed text-white/80">{p.excerpt}</p>}
        <div className="mt-4 flex items-center gap-2.5 text-white">
          <Avatar name={authorName(p)} src={p.author?.avatarUrl ?? null} size={30} />
          <span className="text-[13px] font-semibold">{authorName(p)}</span>
          <span className="text-xs text-white/65">
            · {formatPostDate(p.publishedAt ?? p.updatedAt)} · {p.readMinutes} min read
          </span>
          <span className="ml-auto flex items-center gap-3 text-[13px] text-white/85">
            <span className="flex items-center gap-1" aria-label={`${p.likeCount} likes`}>
              <Heart size={14} className="fill-white/70" /> {p.likeCount}
            </span>
            <span className="flex items-center gap-1" aria-label={`${p.commentCount} comments`}>
              <MessageCircle size={14} /> {p.commentCount}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}

export function PostCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-[20px] border border-border bg-card', className)}>
      <Skeleton className="h-40 rounded-none sm:h-44" />
      <div className="flex flex-col gap-2.5 p-4 sm:px-5">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-4 w-[88%]" />
        <Skeleton className="h-4 w-[65%]" />
        <Skeleton className="h-3 w-full" />
        <div className="mt-1 flex items-center gap-2.5">
          <Skeleton className="size-7 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
}
