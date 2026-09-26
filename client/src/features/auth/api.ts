import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { api, ApiError, setUnauthorizedHandler } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { createStore, useStore } from '@/lib/store';
import type { User } from './types';
import type { LoginValues } from './schemas';

export const meQueryKey = ['auth', 'me'] as const;

// Set when the session ends on its own while someone is using the app (expired, logged out on another
// device, password changed). The app stays put behind the "Session expired" modal instead of vanishing.
const expiredStore = createStore<User | null>(null);
export const useExpiredSession = () => useStore(expiredStore, (s) => s);
export const isSessionExpired = () => expiredStore.get() !== null;

// Leaving "Session expired" goes to the login form (not Welcome): <RequireAuth> reads this when it redirects.
type LoginReturn = { from?: string; identifier?: string };
let loginReturn: LoginReturn | null = null;
export const pendingLoginReturn = () => loginReturn;
export function leaveExpiredSession(qc: QueryClient, next: LoginReturn) {
  endSession(qc);
  loginReturn = next;
}

// The single source of truth for "who is logged in". null = logged out.
export function useMe() {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: async (): Promise<User | null> => {
      try {
        const { user } = await api<{ user: User }>('/auth/me');
        return user;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          // Was signed in a moment ago → keep them (and their screen) and ask them to log in again.
          const was = queryClient.getQueryData<User | null>(meQueryKey);
          if (was) {
            expiredStore.set(() => was);
            return was;
          }
          return null;
        }
        // 403 = suspended/banned -> logged out (the login page says why)
        if (err instanceof ApiError && err.status === 403) return null;
        throw err;
      }
    },
    staleTime: Infinity,
  });
}

// Any other request that comes back 401: re-check the session (once, however many requests failed).
setUnauthorizedHandler(() => {
  if (queryClient.getQueryData(meQueryKey) && !expiredStore.get()) void queryClient.invalidateQueries({ queryKey: meQueryKey });
});

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: LoginValues) =>
      api<{ user: User }>('/auth/login', { method: 'POST', body: values }).then((d) => d.user),
    onSuccess: (user) => {
      loginReturn = null;
      expiredStore.reset();
      qc.setQueryData(meQueryKey, user);
    },
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

// Signed out (logout, deleted account…): tell every guard first, then forget the old session's data.
// (Clearing the cache first would leave mounted guards watching a removed query — no redirect.)
export function endSession(qc: QueryClient) {
  loginReturn = null;
  expiredStore.reset();
  qc.setQueryData(meQueryKey, null);
  qc.removeQueries({ predicate: (q) => q.queryKey[0] !== meQueryKey[0] });
}

function useSignOut(path: '/auth/logout' | '/auth/logout-all') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<{ message: string }>(path, { method: 'POST' }),
    onSuccess: () => endSession(qc), // guards redirect to /welcome
  });
}

export const useLogout = () => useSignOut('/auth/logout');
export const useLogoutAll = () => useSignOut('/auth/logout-all');
