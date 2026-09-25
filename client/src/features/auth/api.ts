import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import type { User } from './types';
import type { LoginValues } from './schemas';

export const meQueryKey = ['auth', 'me'] as const;

// The single source of truth for "who is logged in". null = logged out.
export function useMe() {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: async (): Promise<User | null> => {
      try {
        const { user } = await api<{ user: User }>('/auth/me');
        return user;
      } catch (err) {
        // 401 = no/expired session, 403 = suspended/banned -> treat as logged out
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) return null;
        throw err;
      }
    },
    staleTime: Infinity,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: LoginValues) =>
      api<{ user: User }>('/auth/login', { method: 'POST', body: values }).then((d) => d.user),
    onSuccess: (user) => qc.setQueryData(meQueryKey, user),
  });
}

export type RegisterPayload = { username: string; displayName: string; email: string; password: string };

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegisterPayload) =>
      api<{ user: User }>('/auth/register', { method: 'POST', body: payload }).then((d) => d.user),
    onSuccess: (user) => qc.setQueryData(meQueryKey, user),
  });
}

function useSignOut(path: '/auth/logout' | '/auth/logout-all') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<{ message: string }>(path, { method: 'POST' }),
    onSuccess: () => {
      qc.clear(); // drop every cached query from the previous session
      qc.setQueryData(meQueryKey, null); // guards redirect to /welcome
    },
  });
}

export const useLogout = () => useSignOut('/auth/logout');
export const useLogoutAll = () => useSignOut('/auth/logout-all');
