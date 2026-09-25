import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from '@/lib/toast';
import { api, upload } from '@/lib/api';
import { chatKeys } from '@/features/chat/cache';
import type { CommunityCard, CommunityCategory, CommunityDetail, CommunityTheme } from './types';

export const communityKeys = {
  all: ['communities'] as const,
  discover: (q: string, category: string) => ['communities', 'discover', q, category] as const,
  detail: (id: string) => ['communities', 'detail', id] as const,
  invite: (code: string) => ['communities', 'invite', code] as const,
};

export function useDiscover(q: string, category: CommunityCategory | 'All') {
  return useInfiniteQuery({
    queryKey: communityKeys.discover(q, category),
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ page: String(pageParam) });
      if (q.trim()) params.set('q', q.trim());
      if (category !== 'All') params.set('category', category);
      return api<{ communities: CommunityCard[]; hasMore: boolean }>(`/communities/discover?${params}`);
    },
    initialPageParam: 1,
    getNextPageParam: (last, pages) => (last.hasMore ? pages.length + 1 : undefined),
    placeholderData: keepPreviousData, // typing a search keeps the old results up until the new ones land
  });
}

export function useCommunity(id: string | undefined) {
  return useQuery({
    queryKey: communityKeys.detail(id ?? ''),
    queryFn: () => api<{ community: CommunityDetail }>(`/communities/${id}`).then((d) => d.community),
    enabled: !!id,
  });
}

export function useInvitePreview(code: string) {
  return useQuery({
    queryKey: communityKeys.invite(code),
    queryFn: () => api<{ community: CommunityDetail }>(`/communities/invite/${code}`).then((d) => d.community),
    retry: false,
  });
}

// Any change to a community: store the fresh detail and refresh lists that show it.
function useCommunityMutation<V>(fn: (vars: V) => Promise<{ community: CommunityDetail }>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: V) => fn(vars).then((d) => d.community),
    onSuccess: (community) => {
      qc.setQueryData(communityKeys.detail(community.id), community);
      void qc.invalidateQueries({ queryKey: ['communities', 'discover'] });
      void qc.invalidateQueries({ queryKey: chatKeys.conversations }); // community chats live in the chat list cache
    },
  });
}

export type CommunityInput = {
  name: string;
  description?: string;
  category: CommunityCategory;
  visibility: 'public' | 'private';
  icon?: string;
  theme?: CommunityTheme;
};

export const useCreateCommunity = () =>
  useCommunityMutation((input: CommunityInput) => api('/communities', { method: 'POST', body: input }));

export const useUpdateCommunity = (id: string) =>
  useCommunityMutation((input: Partial<CommunityInput> & { removeCover?: boolean }) =>
    api(`/communities/${id}`, { method: 'PATCH', body: input }),
  );

export const useUploadCover = (id: string) =>
  useCommunityMutation((file: Blob) => {
    const form = new FormData();
    form.append('file', file, 'cover');
    return upload(`/communities/${id}/cover`, form);
  });

export const useJoinCommunity = () =>
  useCommunityMutation((id: string) => api(`/communities/${id}/join`, { method: 'POST' }));

export const useCancelRequest = () =>
  useCommunityMutation((id: string) => api(`/communities/${id}/join`, { method: 'DELETE' }));

export const useAnswerRequest = (id: string) =>
  useCommunityMutation(({ userId, approve }: { userId: string; approve: boolean }) =>
    api(`/communities/${id}/requests/${userId}/${approve ? 'approve' : 'reject'}`, { method: 'POST' }),
  );

export const useResetInvite = (id: string) =>
  useCommunityMutation(() => api(`/communities/${id}/invite/reset`, { method: 'POST' }));

export const useJoinByInvite = () =>
  useCommunityMutation((code: string) => api(`/communities/invite/${code}/join`, { method: 'POST' }));

// Hook-level onSuccess: still runs after the chat screen unmounts (the "removed" event can close it first).
export function useDeleteCommunity() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (id: string) => api<{ deleted: boolean }>(`/communities/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast('Community deleted');
      navigate('/communities', { replace: true });
      void qc.invalidateQueries({ queryKey: communityKeys.all });
      void qc.invalidateQueries({ queryKey: chatKeys.conversations });
    },
  });
}
