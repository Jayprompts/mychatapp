import { Bookmark, Heart, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useToggleBookmark, useToggleLike } from '../api';
import type { PostCard } from '../types';

const stop = (e: React.MouseEvent) => {
  e.preventDefault(); // buttons sit inside card links
  e.stopPropagation();
};

// Card: a small heart + count. Post page ("pill"): the design's gradient pill when liked.
export function LikeButton({ post, variant = 'inline' }: { post: PostCard; variant?: 'inline' | 'pill' }) {
  const toggle = useToggleLike();
  const label = `${post.liked ? 'Unlike' : 'Like'} · ${post.likeCount} ${post.likeCount === 1 ? 'like' : 'likes'}`;
  const onClick = (e: React.MouseEvent) => {
    stop(e);
    toggle.mutate({ id: post.id, liked: !post.liked });
  };

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={post.liked}
        aria-label={label}
        className={cn(
          'inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-all active:scale-95',
          post.liked ? 'gradient-brand text-white shadow-brand' : 'border-[1.5px] border-border text-text-secondary hover:bg-bg',
        )}
      >
        <Heart size={16} className={cn(post.liked && 'fill-white')} />
        {post.likeCount}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={post.liked}
      aria-label={label}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-1.5 py-1 text-xs font-medium transition-colors',
        post.liked ? 'text-error' : 'text-text-secondary hover:text-error',
      )}
    >
      <Heart size={14} className={cn(post.liked && 'fill-error')} />
      {post.likeCount}
    </button>
  );
}

export function BookmarkButton({ post, size = 'sm' }: { post: PostCard; size?: 'sm' | 'md' }) {
  const toggle = useToggleBookmark();
  return (
    <button
      type="button"
      onClick={(e) => {
        stop(e);
        toggle.mutate({ id: post.id, bookmarked: !post.bookmarked });
      }}
      aria-pressed={post.bookmarked}
      aria-label={post.bookmarked ? 'Remove from saved' : 'Save post'}
      title={post.bookmarked ? 'Remove from saved' : 'Save post'}
      className={cn(
        'inline-flex items-center justify-center rounded-full transition-colors',
        size === 'md' ? 'size-9 border-[1.5px]' : 'size-7',
        post.bookmarked ? 'border-primary/25 bg-primary/8 text-primary' : 'border-border text-text-secondary hover:bg-bg hover:text-text-primary',
      )}
    >
      <Bookmark size={size === 'md' ? 17 : 15} className={cn(post.bookmarked && 'fill-primary')} />
    </button>
  );
}

export function CommentCount({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1 px-1 text-xs text-text-secondary" aria-label={`${count} comments`}>
      <MessageCircle size={14} />
      {count}
    </span>
  );
}
