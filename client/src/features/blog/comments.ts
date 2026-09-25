import { useEffect } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData, type QueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { toast } from '@/lib/toast';
import { postKeys } from './api';
import type { CommentThread, CommentView, ReportReason, ReportTarget } from './types';

type Page = { comments: CommentThread[]; hasMore: boolean; total: number };
export const commentKeys = { list: (postId: string) => ['posts', 'comments', postId] as const };

// Threads, oldest first, 20 at a time.
export function useComments(postId: string) {
  return useInfiniteQuery({
    queryKey: commentKeys.list(postId),
    queryFn: ({ pageParam }) => api<Page>(`/posts/${postId}/comments${pageParam ? `?after=${pageParam}` : ''}`),
    initialPageParam: '' as string,
    getNextPageParam: (last) => (last.hasMore ? last.comments.at(-1)?.id : undefined),
  });
}

// Comment count lives on the post; after any change, refresh both.
function refresh(qc: QueryClient, postId: string) {
  void qc.invalidateQueries({ queryKey: commentKeys.list(postId) });
  void qc.invalidateQueries({ queryKey: postKeys.detail(postId) });
  void qc.invalidateQueries({ queryKey: postKeys.lists });
}

export function useAddComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { body: string; parentId?: string }) =>
      api<{ comment: CommentView }>(`/posts/${postId}/comments`, { method: 'POST', body: input }).then((d) => d.comment),
    onSuccess: () => refresh(qc, postId),
  });
}

export function useEditComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      api<{ comment: CommentView }>(`/comments/${id}`, { method: 'PATCH', body: { body } }).then((d) => d.comment),
    onSuccess: (c) => patchComment(qc, postId, c.id, () => c),
  });
}

export function useDeleteComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<{ deleted: boolean }>(`/comments/${id}`, { method: 'DELETE' }),
    onSuccess: () => refresh(qc, postId),
  });
}

function patchComment(qc: QueryClient, postId: string, id: string, fn: (c: CommentView) => Partial<CommentView>) {
  const apply = <T extends CommentView>(c: T): T => (c.id === id ? { ...c, ...fn(c) } : c);
  qc.setQueryData<InfiniteData<Page>>(commentKeys.list(postId), (data) =>
    data
      ? {
          ...data,
          pages: data.pages.map((p) => ({ ...p, comments: p.comments.map((t) => ({ ...apply(t), replies: t.replies.map(apply) })) })),
        }
      : data,
  );
}

export function useToggleCommentLike(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, liked }: { id: string; liked: boolean }) =>
      api<{ liked: boolean; likeCount: number }>(`/comments/${id}/like`, { method: liked ? 'POST' : 'DELETE' }),
    onMutate: ({ id, liked }) => patchComment(qc, postId, id, (c) => ({ liked, likeCount: Math.max(0, c.likeCount + (liked ? 1 : -1)) })),
    onSuccess: (res, { id }) => patchComment(qc, postId, id, () => res),
    onError: (err, { id, liked }) => {
      patchComment(qc, postId, id, (c) => ({ liked: !liked, likeCount: Math.max(0, c.likeCount + (liked ? -1 : 1)) }));
      toast(err instanceof Error ? err.message : "Couldn't update the like", 'error');
    },
  });
}

export function useReport() {
  return useMutation({
    mutationFn: (input: { target: ReportTarget; reason: ReportReason; details?: string }) =>
      api<{ reported: boolean; alreadyReported: boolean }>('/reports', {
        method: 'POST',
        body: { targetType: input.target.type, targetId: input.target.id, reason: input.reason, details: input.details || undefined },
      }),
  });
}

// While a post is open: join its live room, so new comments (and counts) appear without a refresh.
export function usePostLive(postId: string | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!postId) return;
    const socket = getSocket();
    const watch = () => socket.emit('post:watch', { postId });
    const onComments = (p: { postId: string }) => p.postId === postId && refresh(qc, postId);
    watch();
    socket.on('connect', watch); // rejoin after a reconnect
    socket.on('post:comments', onComments);
    return () => {
      socket.emit('post:unwatch', { postId });
      socket.off('connect', watch);
      socket.off('post:comments', onComments);
    };
  }, [postId, qc]);
}
