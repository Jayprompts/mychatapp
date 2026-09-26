import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Role } from '@/features/auth/types';
import { api } from '@/lib/api';
import type { AdminStats, AdminUser, AuditEntry, Paged } from './types';

export const adminKeys = { all: ['admin'] as const };

const qs = (params: Record<string, string | number | undefined>) =>
  new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])).toString();

export const useAdminStats = () => useQuery({ queryKey: ['admin', 'stats'], queryFn: () => api<AdminStats>('/admin/stats') });

export type UserFilters = { q?: string; role?: Role; status?: AdminUser['status']; page: number };
export function useAdminUsers(f: UserFilters) {
  return useQuery({
    queryKey: ['admin', 'users', f],
    queryFn: () => api<Paged<'users', AdminUser>>(`/admin/users?${qs(f)}`),
    placeholderData: keepPreviousData,
  });
}

export const useStaff = () =>
  useQuery({ queryKey: ['admin', 'staff'], queryFn: () => api<{ users: AdminUser[]; counts: Record<string, number> }>('/admin/staff') });

export type AuditFilters = { actor?: string; action?: string; page: number };
export function useAudit(f: AuditFilters) {
  return useQuery({
    queryKey: ['admin', 'audit', f],
    queryFn: () => api<Paged<'entries', AuditEntry> & { actors: { id: string; name: string }[] }>(`/admin/audit?${qs(f)}`),
    placeholderData: keepPreviousData,
  });
}

// Every admin change refreshes all admin screens (lists, counts, the dashboard, the audit log).
function useAdminMutation<I, O>(fn: (input: I) => Promise<O>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSettled: () => void qc.invalidateQueries({ queryKey: adminKeys.all }) });
}

export const useSetStatus = () =>
  useAdminMutation(({ id, status, reason }: { id: string; status: AdminUser['status']; reason?: string }) =>
    api<{ user: AdminUser }>(`/admin/users/${id}/status`, { method: 'PATCH', body: { status, reason: reason || undefined } }),
  );
export const useSetRole = () =>
  useAdminMutation(({ id, role }: { id: string; role: Role }) => api<{ user: AdminUser }>(`/admin/users/${id}/role`, { method: 'PATCH', body: { role } }));
export const useDeleteUser = () => useAdminMutation((id: string) => api<{ deleted: boolean }>(`/admin/users/${id}`, { method: 'DELETE' }));
export const useBulkUsers = () =>
  useAdminMutation((body: { ids: string[]; action: 'suspend' | 'ban' | 'activate' | 'delete'; reason?: string }) =>
    api<{ done: string[]; skipped: { id: string; reason: string }[] }>('/admin/users/bulk', { method: 'POST', body }),
  );
