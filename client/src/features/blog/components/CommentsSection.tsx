import { useState } from 'react';
import { Link } from 'react-router';
import { Flag, Heart, MessageCircle, Pencil, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormAlert } from '@/components/ui/FormAlert';
import { Menu, type MenuItem } from '@/components/ui/Menu';
import { Skeleton } from '@/components/ui/Skeleton';
import { useMe } from '@/features/auth/api';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatAgo } from '@/lib/time';
import { toast } from '@/lib/toast';
import { useAddComment, useComments, useDeleteComment, useEditComment, useToggleCommentLike } from '../comments';
import type { CommentThread, CommentView, ReportTarget } from '../types';
import { InlineText } from './Markdown';

type Props = { postId: string; total: number; onReport: (target: ReportTarget) => void };

// Comments, per the design: a composer, then threads (one level of replies) with like / reply / ⋯.
export function CommentsSection({ postId, total, onReport }: Props) {
  const comments = useComments(postId);
  const threads = comments.data?.pages.flatMap((p) => p.comments) ?? [];

  return (
    <section aria-label="Comments" className="mt-10">
      <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-text-primary sm:text-xl">
        <MessageCircle size={20} className="text-primary" /> Comments ({total})
      </h2>

      <Composer postId={postId} />

      <div className="mt-6 flex flex-col gap-5">
        {comments.isPending ? (
          Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="size-9 rounded-full" />
              <Skeleton className="h-16 flex-1 rounded-2xl" />
            </div>
          ))
        ) : comments.isError ? (
          <FormAlert>{errorMessage(comments.error)}</FormAlert>
        ) : threads.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-text-secondary">
            No comments yet — start the conversation.
          </p>
        ) : (
          threads.map((t) => <Thread key={t.id} postId={postId} thread={t} onReport={onReport} />)
        )}
      </div>

      {comments.hasNextPage && (
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" size="sm" onClick={() => void comments.fetchNextPage()} loading={comments.isFetchingNextPage}>
            Load more comments
          </Button>
        </div>
      )}
    </section>
  );
}

function Composer({
  postId,
  parent,
  onDone,
  autoFocus = false,
}: {
  postId: string;
  parent?: CommentView; // replying
  onDone?: () => void;
  autoFocus?: boolean;
}) {
  const { data: me } = useMe();
  const [text, setText] = useState('');
  const add = useAddComment(postId);
  const send = () => {
    const body = text.trim();
    if (!body || add.isPending) return;
    add.mutate(
      { body, ...(parent ? { parentId: parent.id } : {}) },
      {
        onSuccess: () => {
          setText('');
          onDone?.();
        },
        onError: (e) => toast(errorMessage(e), 'error'),
      },
    );
  };
  const who = parent?.author?.displayName.split(' ')[0];

  return (
    <div className={cn('flex items-start gap-2.5', parent && 'mt-2 rounded-xl border-[1.5px] border-primary/15 bg-primary/3 p-2.5')}>
      {me && <Avatar name={me.displayName} src={me.avatarUrl} size={parent ? 28 : 36} />}
      <div className="min-w-0 flex-1">
        {parent && <p className="mb-1 text-[11px] font-semibold text-primary">Replying to @{parent.author?.username ?? 'comment'}</p>}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send();
            if (e.key === 'Escape' && parent) onDone?.();
          }}
          autoFocus={autoFocus}
          maxLength={2000}
          rows={parent ? 2 : 3}
          aria-label={parent ? `Reply to ${who ?? 'comment'}` : 'Write a comment'}
          placeholder={parent ? `Reply to ${who ?? 'this comment'}…` : 'Share your thoughts…'}
          className={cn(
            'w-full resize-none rounded-xl border-[1.5px] border-border bg-card px-3.5 py-2.5 text-sm leading-relaxed text-text-primary outline-none [field-sizing:content] placeholder:text-text-tertiary focus:border-primary focus:shadow-[0_0_0_3px_rgba(8,102,255,0.12)]',
            parent ? 'min-h-16' : 'min-h-20',
          )}
        />
        {(text.trim() || parent) && (
          <div className="mt-2 flex items-center justify-end gap-2">
            {parent && (
              <button type="button" onClick={onDone} className="px-2 text-[13px] font-semibold text-text-secondary hover:text-text-primary">
                Cancel
              </button>
            )}
            <Button size="sm" onClick={send} loading={add.isPending} disabled={!text.trim()}>
              {parent ? 'Reply' : 'Post comment'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Thread({ postId, thread, onReport }: { postId: string; thread: CommentThread; onReport: Props['onReport'] }) {
  const [replyingTo, setReplyingTo] = useState<CommentView | null>(null);
  return (
    <div>
      <CommentItem postId={postId} comment={thread} onReply={setReplyingTo} onReport={onReport} />
      {(thread.replies.length > 0 || replyingTo) && (
        <div className="mt-2.5 ml-[18px] flex flex-col gap-2.5 border-l-2 border-border pl-4 sm:ml-[18px] sm:pl-5">
          {thread.replies.map((r) => (
            <CommentItem key={r.id} postId={postId} comment={r} onReply={setReplyingTo} onReport={onReport} small />
          ))}
          {replyingTo && <Composer key={replyingTo.id} postId={postId} parent={replyingTo} onDone={() => setReplyingTo(null)} autoFocus />}
        </div>
      )}
    </div>
  );
}

function CommentItem({
  postId,
  comment: c,
  onReply,
  onReport,
  small = false,
}: {
  postId: string;
  comment: CommentView;
  onReply: (c: CommentView) => void;
  onReport: Props['onReport'];
  small?: boolean;
}) {
  const { data: me } = useMe();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(c.body);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const edit = useEditComment(postId);
  const del = useDeleteComment(postId);
  const like = useToggleCommentLike(postId);
  const mine = !!me && c.author?.id === me.id;

  if (c.deleted) {
    return (
      <div className="flex items-center gap-2.5">
        <span className={cn('shrink-0 rounded-full bg-surface-2', small ? 'size-7' : 'size-9')} aria-hidden />
        <p className="rounded-2xl border border-dashed border-border px-3.5 py-2 text-[13px] text-text-secondary italic">Comment deleted</p>
      </div>
    );
  }

  const items: MenuItem[] = [];
  if (c.canEdit)
    items.push({
      label: 'Edit',
      icon: <Pencil size={15} />,
      onSelect: () => {
        setDraft(c.body);
        setEditing(true);
      },
    });
  if (c.canDelete) items.push({ label: 'Delete', icon: <Trash2 size={15} />, danger: true, onSelect: () => setConfirmDelete(true) });
  if (!mine) items.push({ label: 'Report comment', icon: <Flag size={15} />, danger: true, onSelect: () => onReport({ type: 'comment', id: c.id }) });

  const name = c.author?.displayName ?? 'Deleted user';
  return (
    <div className="flex gap-2.5" id={`comment-${c.id}`}>
      <Avatar name={name} src={c.author?.avatarUrl ?? null} size={small ? 28 : 36} />
      <div className="min-w-0 flex-1">
        <div className={cn('rounded-2xl border px-3.5 py-2.5', mine ? 'border-primary/15 bg-primary/4' : 'border-border bg-card')}>
          <div className="flex items-start justify-between gap-2">
            <p className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 text-[13px]">
              {c.author ? (
                <Link to={`/u/${c.author.username}`} className="font-bold text-text-primary hover:underline">
                  {name}
                </Link>
              ) : (
                <span className="font-bold text-text-primary">{name}</span>
              )}
              {mine && <span className="rounded-full bg-primary/10 px-1.5 text-[10px] font-bold text-primary">You</span>}
              <span className="text-[11px] text-text-secondary">
                {formatAgo(c.createdAt)}
                {c.editedAt && ' · edited'}
              </span>
            </p>
            <Menu items={items} label="Comment options" className="-mt-1.5 -mr-2" />
          </div>
          {c.replyTo && <p className="text-[11px] font-semibold text-primary">Replying to @{c.replyTo.username}</p>}
          {editing ? (
            <div className="mt-1.5">
              <textarea
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && setEditing(false)}
                maxLength={2000}
                aria-label="Edit comment"
                className="w-full resize-none rounded-lg border-[1.5px] border-primary/40 bg-card px-3 py-2 text-sm text-text-primary outline-none [field-sizing:content]"
              />
              <div className="mt-1.5 flex justify-end gap-2">
                <button type="button" onClick={() => setEditing(false)} className="px-2 text-[13px] font-semibold text-text-secondary">
                  Cancel
                </button>
                <Button
                  size="sm"
                  loading={edit.isPending}
                  disabled={!draft.trim() || draft.trim() === c.body}
                  onClick={() =>
                    edit.mutate({ id: c.id, body: draft.trim() }, { onSuccess: () => setEditing(false), onError: (e) => toast(errorMessage(e), 'error') })
                  }
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <InlineText text={c.body} className={cn('mt-0.5 leading-relaxed text-text-primary', small ? 'text-[13px]' : 'text-sm')} />
          )}
        </div>

        <div className="mt-1 flex items-center gap-1 pl-1.5">
          <button
            type="button"
            onClick={() => like.mutate({ id: c.id, liked: !c.liked })}
            aria-pressed={c.liked}
            aria-label={`${c.liked ? 'Unlike' : 'Like'} comment · ${c.likeCount}`}
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold transition-colors',
              c.liked ? 'text-error' : 'text-text-secondary hover:text-error',
            )}
          >
            <Heart size={13} className={cn(c.liked && 'fill-error')} /> {c.likeCount > 0 && c.likeCount}
          </button>
          <button
            type="button"
            onClick={() => onReply(c)}
            className="rounded-full px-2 py-1 text-xs font-semibold text-text-secondary transition-colors hover:text-primary"
          >
            Reply
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this comment?"
        body={mine ? "It's removed for everyone. Replies stay." : "It's removed for everyone (you can moderate comments on your post)."}
        confirmLabel="Delete"
        loading={del.isPending}
        error={del.isError ? errorMessage(del.error) : null}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => del.mutate(c.id, { onSuccess: () => (setConfirmDelete(false), toast('Comment deleted')) })}
      />
    </div>
  );
}
