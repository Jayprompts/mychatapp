import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft, EyeOff, FileSearch, Flag, Pencil, Share2, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Lightbox } from '@/components/ui/Lightbox';
import { Menu, type MenuItem } from '@/components/ui/Menu';
import { Skeleton } from '@/components/ui/Skeleton';
import { buttonClasses } from '@/components/ui/buttonClasses';
import { useDeletePost, usePost, useUpdatePost } from '@/features/blog/api';
import { usePostLive } from '@/features/blog/comments';
import { CommentsSection } from '@/features/blog/components/CommentsSection';
import { ReportDialog } from '@/features/blog/components/ReportDialog';
import { ShareDialog } from '@/features/blog/components/ShareDialog';
import { Markdown } from '@/features/blog/components/Markdown';
import { BookmarkButton, LikeButton } from '@/features/blog/components/PostActions';
import { authorName } from '@/features/blog/format';
import { PostCover } from '@/features/blog/components/PostCover';
import { TagChip } from '@/features/blog/components/TagChip';
import { summarySource } from '@/features/blog/markdown';
import type { PostDetail, ReportTarget } from '@/features/blog/types';
import { errorMessage } from '@/lib/api';
import { formatPostDate } from '@/lib/time';
import { toast } from '@/lib/toast';

// /blog/:postId — full-screen reading view on phones, a centered 720px column on larger screens.
export function PostPage() {
  const { postId } = useParams();
  const post = usePost(postId);
  usePostLive(post.data?.status === 'published' ? postId : undefined); // live comments while reading
  const [sharing, setSharing] = useState(false);
  const [reporting, setReporting] = useState<ReportTarget | null>(null);
  const actions = { onShare: () => setSharing(true), onReport: setReporting };

  return (
    <div className="flex flex-1 flex-col bg-bg">
      <TopBar post={post.data} {...actions} />
      {post.isPending ? (
        <PostSkeleton />
      ) : post.data ? (
        <>
          <Article post={post.data} {...actions} />
          <ShareDialog post={post.data} open={sharing} onClose={() => setSharing(false)} />
          <ReportDialog target={reporting} onClose={() => setReporting(null)} />
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <EmptyState
            icon={FileSearch}
            title="Post not found"
            description="It may have been deleted, or moved back to drafts by its author."
            action={
              <Link to="/blog" className={buttonClasses({ variant: 'secondary' })}>
                Back to the blog
              </Link>
            }
          />
        </div>
      )}
    </div>
  );
}

type Actions = { onShare: () => void; onReport: (target: ReportTarget) => void };

function TopBar({ post, onShare, onReport }: { post?: PostDetail } & Actions) {
  const navigate = useNavigate();
  const back = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/blog'));
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2.5 border-b border-border bg-card/95 px-3 backdrop-blur sm:px-5">
      <button
        type="button"
        onClick={back}
        aria-label="Back"
        className="flex size-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-border bg-bg text-text-primary transition-colors hover:bg-surface-2"
      >
        <ArrowLeft size={18} />
      </button>
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">{post?.title}</span>
      {post && (
        <span className="hidden sm:block">
          <TagChip tag={post.tag} />
        </span>
      )}
      {post?.status === 'published' && (
        <button
          type="button"
          onClick={onShare}
          aria-label="Share post"
          className="flex size-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
        >
          <Share2 size={18} />
        </button>
      )}
      {post && <PostMenu post={post} onReport={onReport} />}
    </header>
  );
}

function PostMenu({ post, onReport }: { post: PostDetail; onReport: Actions['onReport'] }) {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const del = useDeletePost();
  const update = useUpdatePost(post.id);

  const items: MenuItem[] = [];
  if (post.canEdit) items.push({ label: 'Edit post', icon: <Pencil size={16} />, onSelect: () => navigate(`/blog/write/${post.id}`) });
  if (post.canEdit && post.status === 'published') {
    items.push({
      label: 'Move to drafts',
      icon: <EyeOff size={16} />,
      onSelect: () =>
        update.mutate(
          { status: 'draft' },
          { onSuccess: () => toast('Moved to drafts — only you can see it now'), onError: (e) => toast(errorMessage(e), 'error') },
        ),
    });
  }
  if (post.canDelete) items.push({ label: 'Delete post', icon: <Trash2 size={16} />, danger: true, onSelect: () => setConfirmDelete(true) });
  if (!post.canEdit && post.status === 'published') {
    items.push({ label: 'Report post', icon: <Flag size={16} />, danger: true, onSelect: () => onReport({ type: 'post', id: post.id }) });
  }

  return (
    <>
      <Menu items={items} label="Post options" />
      <ConfirmDialog
        open={confirmDelete}
        title="Delete this post?"
        body="The post, its photos, likes and saves are removed for everyone. This can't be undone."
        confirmLabel="Delete post"
        loading={del.isPending}
        error={del.isError ? errorMessage(del.error) : null}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => del.mutate(post.id)} // the hook navigates back to the blog
      />
    </>
  );
}

function Article({ post: p, onShare, onReport }: { post: PostDetail } & Actions) {
  const [viewing, setViewing] = useState<number | null>(null);
  const update = useUpdatePost(p.id);
  const published = p.status === 'published';
  // Show the summary as a stand-first only when the author wrote one (not the automatic opening lines).
  const customSummary = p.excerpt && !summarySource(p.body).startsWith(p.excerpt.replace(/…$/, ''));

  return (
    <article className="mx-auto w-full max-w-3xl pb-16 sm:px-6">
      <PostCover coverUrl={p.coverUrl} theme={p.coverTheme} className="h-52 sm:mt-6 sm:h-80 sm:rounded-3xl" />

      <div className="px-4 pt-6 sm:px-0 sm:pt-8">
        {!published && (
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-[#8A6A00]">
            <EyeOff size={16} className="shrink-0" />
            <span className="flex-1">This is a draft — only you can see it.</span>
            <Link to={`/blog/write/${p.id}`} className={buttonClasses({ size: 'sm', variant: 'outline' })}>
              Continue editing
            </Link>
            <Button
              size="sm"
              loading={update.isPending}
              onClick={() =>
                update.mutate({ status: 'published' }, { onSuccess: () => toast('Post published 🎉'), onError: (e) => toast(errorMessage(e), 'error') })
              }
            >
              Publish
            </Button>
          </div>
        )}

        <TagChip tag={p.tag} className="sm:hidden" />
        <h1 className="mt-2 text-[26px] leading-tight font-extrabold tracking-tight text-balance text-text-primary sm:mt-0 sm:text-[34px]">
          {p.title || 'Untitled draft'}
        </h1>

        <div className="mt-5 flex items-center gap-3 border-b border-border pb-5">
          <Avatar name={authorName(p)} src={p.author?.avatarUrl ?? null} size={44} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold text-text-primary">{authorName(p)}</p>
            <p className="text-[13px] text-text-secondary">
              {published ? formatPostDate(p.publishedAt ?? p.updatedAt) : 'Not published'} · {p.readMinutes} min read
            </p>
          </div>
          {published && (
            <div className="flex items-center gap-2">
              <LikeButton post={p} variant="pill" />
              <BookmarkButton post={p} size="md" />
            </div>
          )}
        </div>

        {customSummary && (
          <p className="mt-6 border-l-[3px] border-l-primary/50 pl-4 text-[17px] leading-relaxed text-text-secondary italic sm:text-[19px]">{p.excerpt}</p>
        )}

        <Markdown source={p.body} className="mt-6" />

        {p.images.length > 0 && (
          <section aria-label="Photos" className="mt-8">
            <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
              {p.images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setViewing(i)}
                  aria-label={`Open photo ${i + 1} of ${p.images.length}`}
                  className="shrink-0 snap-start overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <img
                    src={img.url}
                    alt=""
                    loading="lazy"
                    className="h-44 w-auto max-w-[80vw] bg-surface-2 object-cover transition-transform hover:scale-[1.02] sm:h-52"
                    style={{ aspectRatio: `${img.width} / ${img.height}` }}
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {published && (
          <div className="mt-10 flex flex-wrap items-center gap-3 border-y border-border py-5">
            <LikeButton post={p} variant="pill" />
            <BookmarkButton post={p} size="md" />
            <span className="text-[13px] text-text-secondary">
              {p.commentCount} {p.commentCount === 1 ? 'comment' : 'comments'}
            </span>
            <Button variant="outline" size="sm" onClick={onShare} className="ml-auto">
              <Share2 size={15} /> Share
            </Button>
          </div>
        )}

        {published && <CommentsSection postId={p.id} total={p.commentCount} onReport={onReport} />}
      </div>

      {viewing !== null && (
        <Lightbox images={p.images.map((img, i) => ({ src: img.url, alt: `Photo ${i + 1}` }))} startIndex={viewing} onClose={() => setViewing(null)} />
      )}
    </article>
  );
}

function PostSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl sm:px-6">
      <Skeleton className="h-52 rounded-none sm:mt-6 sm:h-80 sm:rounded-3xl" />
      <div className="flex flex-col gap-3 px-4 pt-8 sm:px-0">
        <Skeleton className="h-8 w-4/5" />
        <Skeleton className="h-8 w-3/5" />
        <div className="mt-3 flex items-center gap-3">
          <Skeleton className="size-11 rounded-full" />
          <Skeleton className="h-4 w-40" />
        </div>
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="mt-2 h-4 w-full" />
        ))}
      </div>
    </div>
  );
}
