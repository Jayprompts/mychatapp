import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { api, upload } from '@/lib/api';
import { toast } from '@/lib/toast';
import type { FeedSort, PostCard, PostDetail, PostInput, PostTag } from './types';

type Page = { posts: PostCard[]; hasMore: boolean };

export const postKeys = {
  all: ['posts'] as const,
  lists: ['posts', 'list'] as const,
  feed: (sort: FeedSort, tag: PostTag | 'All') => ['posts', 'list', 'feed', sort, tag] as const,
  saved: ['posts', 'list', 'saved'] as const,
  mine: ['posts', 'list', 'mine'] as const,
  detail: (id: string) => ['posts', 'detail', id] as const,
};

function usePostList(key: readonly unknown[], path: (page: number) => string, keepPrevious = false) {
  return useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam }) => api<Page>(path(pageParam)),
    initialPageParam: 1,
    getNextPageParam: (last, pages) => (last.hasMore ? pages.length + 1 : undefined),
    placeholderData: keepPrevious ? keepPreviousData : undefined,
  });
}

// Switching sort/tag keeps the old cards up (dimmed) until the new ones land.
export function usePostFeed(sort: FeedSort, tag: PostTag | 'All') {
  return usePostList(postKeys.feed(sort, tag), (page) => {
    const params = new URLSearchParams({ sort, page: String(page) });
    if (tag !== 'All') params.set('tag', tag);
    return `/posts?${params}`;
  }, true);
}
export const useSavedPosts = () => usePostList(postKeys.saved, (page) => `/posts/saved?page=${page}`);
export const useMyPosts = () => usePostList(postKeys.mine, (page) => `/posts/mine?page=${page}`);
// Someone's published posts, newest first (profile pages).
export const useAuthorPosts = (authorId: string) =>
  usePostList([...postKeys.lists, 'author', authorId], (page) => `/posts?author=${authorId}&page=${page}`);

export function usePost(id: string | undefined) {
  return useQuery({
    queryKey: postKeys.detail(id ?? ''),
    queryFn: () => api<{ post: PostDetail }>(`/posts/${id}`).then((d) => d.post),
    enabled: !!id,
    retry: (count, err) => (err as { status?: number }).status !== 404 && count < 2,
  });
}

// Apply a change to one post wherever it's cached: feed pages, saved, mine and its detail.
function patchPost(qc: QueryClient, id: string, fn: (p: PostCard) => Partial<PostCard>) {
  qc.setQueriesData<InfiniteData<Page>>({ queryKey: postKeys.lists }, (data) =>
    data
      ? { ...data, pages: data.pages.map((pg) => ({ ...pg, posts: pg.posts.map((p) => (p.id === id ? { ...p, ...fn(p) } : p)) })) }
      : data,
  );
  qc.setQueryData<PostDetail>(postKeys.detail(id), (p) => (p ? { ...p, ...fn(p) } : p));
}

// Server truth after any edit: store the detail, refresh every list it may appear in.
function storePost(qc: QueryClient, post: PostDetail) {
  qc.setQueryData(postKeys.detail(post.id), post);
  void qc.invalidateQueries({ queryKey: postKeys.lists });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PostInput) => api<{ post: PostDetail }>('/posts', { method: 'POST', body: input }).then((d) => d.post),
    onSuccess: (post) => storePost(qc, post),
  });
}

export function useUpdatePost(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PostInput) => api<{ post: PostDetail }>(`/posts/${id}`, { method: 'PATCH', body: input }).then((d) => d.post),
    onSuccess: (post) => storePost(qc, post),
  });
}

// The editor's save: creates the draft the first time, then updates it.
export function useSavePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: PostInput }) =>
      api<{ post: PostDetail }>(id ? `/posts/${id}` : '/posts', { method: id ? 'PATCH' : 'POST', body: input }).then((d) => d.post),
    onSuccess: (post) => storePost(qc, post),
  });
}

// Photos: the post id is passed at call time, because the editor may create the draft just before.
export function usePostUpload(kind: 'cover' | 'images') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, file }: { postId: string; file: File }) => {
      const form = new FormData();
      form.append('file', file);
      return upload<{ post: PostDetail }>(`/posts/${postId}/${kind}`, form).then((d) => d.post);
    },
    onSuccess: (post) => storePost(qc, post),
  });
}

export function useRemovePostImage(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (imageId: string) => api<{ post: PostDetail }>(`/posts/${id}/images/${imageId}`, { method: 'DELETE' }).then((d) => d.post),
    onSuccess: (post) => storePost(qc, post),
  });
}

// Hook-level navigation: the post page unmounts once its data is gone.
export function useDeletePost() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (id: string) => api<{ deleted: boolean }>(`/posts/${id}`, { method: 'DELETE' }),
    onSuccess: (_d, id) => {
      navigate('/blog', { replace: true });
      toast('Post deleted');
      qc.removeQueries({ queryKey: postKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: postKeys.lists });
    },
  });
}

// Like / save: flip instantly, then settle on the server's count (or roll back on error).
export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, liked }: { id: string; liked: boolean }) =>
      api<{ liked: boolean; likeCount: number }>(`/posts/${id}/like`, { method: liked ? 'POST' : 'DELETE' }),
    onMutate: ({ id, liked }) => patchPost(qc, id, (p) => ({ liked, likeCount: Math.max(0, p.likeCount + (liked ? 1 : -1)) })),
    onSuccess: (res, { id }) => patchPost(qc, id, () => res),
    onError: (err, { id, liked }) => {
      patchPost(qc, id, (p) => ({ liked: !liked, likeCount: Math.max(0, p.likeCount + (liked ? -1 : 1)) }));
      toast(err instanceof Error ? err.message : "Couldn't update the like", 'error');
    },
  });
}

export function useToggleBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, bookmarked }: { id: string; bookmarked: boolean }) =>
      api<{ bookmarked: boolean }>(`/posts/${id}/bookmark`, { method: bookmarked ? 'POST' : 'DELETE' }),
    onMutate: ({ id, bookmarked }) => patchPost(qc, id, () => ({ bookmarked })),
    onSuccess: (_res, { bookmarked }) => {
      toast(bookmarked ? 'Saved to your posts' : 'Removed from saved');
      void qc.invalidateQueries({ queryKey: postKeys.saved });
    },
    onError: (err, { id, bookmarked }) => {
      patchPost(qc, id, () => ({ bookmarked: !bookmarked }));
      toast(err instanceof Error ? err.message : "Couldn't save the post", 'error');
    },
  });
}
