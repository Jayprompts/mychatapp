import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { endSession, meQueryKey } from '@/features/auth/api';
import type { OAuthProvider, User } from '@/features/auth/types';
import { chatKeys } from '@/features/chat/cache';
import type { UserSummary } from '@/features/chat/types';
import { api, upload } from '@/lib/api';
import { toast } from '@/lib/toast';
import type { Profile } from './types';

export const profileKeys = {
  all: ['profiles'] as const,
  byUsername: (username: string) => ['profiles', username] as const,
  blocks: ['profiles', 'blocks'] as const,
};

export function useProfile(username: string | undefined) {
  return useQuery({
    queryKey: profileKeys.byUsername(username ?? ''),
    queryFn: () => api<{ profile: Profile }>(`/users/${encodeURIComponent(username!)}`).then((d) => d.profile),
    enabled: !!username,
    retry: (count, err) => (err as { status?: number }).status !== 404 && count < 2,
  });
}

// After my account changes: store the new me, and refresh everything that shows my name or photo.
function storeMe(qc: QueryClient, user: User) {
  qc.setQueryData(meQueryKey, user);
  void qc.invalidateQueries({ queryKey: profileKeys.all });
  void qc.invalidateQueries({ queryKey: chatKeys.conversations });
  void qc.invalidateQueries({ queryKey: ['posts'] });
}

const meMutation = <I,>(fn: (input: I) => Promise<{ user: User }>) =>
  function useMeMutation() {
    const qc = useQueryClient();
    return useMutation({ mutationFn: (input: I) => fn(input).then((d) => d.user), onSuccess: (user) => storeMe(qc, user) });
  };

export type ProfileInput = Partial<Pick<User, 'displayName' | 'username' | 'bio' | 'website' | 'location'>>;
export const useUpdateProfile = meMutation((input: ProfileInput) => api('/users/me', { method: 'PATCH', body: input }));
export const useChangeEmail = meMutation((input: { email: string; password: string }) => api('/users/me/email', { method: 'PATCH', body: input }));
export const useChangePassword = meMutation((input: { currentPassword: string; newPassword: string }) =>
  api('/users/me/password', { method: 'PATCH', body: input }),
);
export const useUpdatePrivacy = meMutation((input: { showOnlineStatus: boolean }) => api('/users/me/privacy', { method: 'PATCH', body: input }));
export const useRemoveAvatar = meMutation(() => api('/users/me/avatar', { method: 'DELETE' }));
export const useUploadAvatar = meMutation((image: Blob) => {
  const form = new FormData();
  form.append('file', image, 'avatar.jpg');
  return upload<{ user: User }>('/users/me/avatar', form);
});

export function useBlockedUsers() {
  return useQuery({ queryKey: profileKeys.blocks, queryFn: () => api<{ users: UserSummary[] }>('/users/me/blocks').then((d) => d.users) });
}

export function useSetBlocked() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, blocked }: { userId: string; blocked: boolean }) =>
      api<{ blocked: boolean }>(`/users/${userId}/block`, { method: blocked ? 'POST' : 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: profileKeys.all });
      void qc.invalidateQueries({ queryKey: chatKeys.conversations });
    },
  });
}

// Deleting the account ends the session: forget everything, the guards send you to /welcome.
export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (password: string) => api<{ deleted: boolean }>('/users/me', { method: 'DELETE', body: { password: password || undefined, confirm: 'DELETE' } }),
    onSuccess: () => {
      endSession(qc);
      toast('Your account has been deleted. Take care.');
    },
  });
}

// Settings ▸ Sign-in methods ▸ Disconnect (the server refuses the last way to sign in)
export function useUnlinkProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider: OAuthProvider) => api<{ user: User }>(`/users/me/providers/${provider}`, { method: 'DELETE' }).then((d) => d.user),
    onSuccess: (user) => qc.setQueryData(meQueryKey, user),
  });
}
