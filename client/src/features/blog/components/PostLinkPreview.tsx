import { Link } from 'react-router';
import { usePost } from '../api';
import { authorName } from '../format';
import { PostCover } from './PostCover';
import { TagChip } from './TagChip';

// A Grove post shared into a chat: a small card that opens the post. Nothing if it's gone or private.
export function PostLinkPreview({ postId }: { postId: string }) {
  const { data: post } = usePost(postId);
  if (!post || post.status !== 'published') return null;
  return (
    <Link
      to={`/blog/${post.id}`}
      className="block w-64 max-w-full overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-primary"
    >
      <PostCover coverUrl={post.coverUrl} theme={post.coverTheme} className="h-24" />
      <div className="flex flex-col gap-1 px-3 py-2.5 text-left">
        <TagChip tag={post.tag} className="self-start" />
        <p className="line-clamp-2 text-sm leading-snug font-bold text-text-primary">{post.title}</p>
        <p className="text-xs text-text-secondary">
          {authorName(post)} · {post.readMinutes} min read
        </p>
      </div>
    </Link>
  );
}
