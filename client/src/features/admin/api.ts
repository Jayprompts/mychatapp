import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Role } from '@/features/auth/types';
import { api } from '@/lib/api';
import type { AdminCommunity, AdminPost, AdminStats, AdminUser, AuditEntry, CommunityMember, Paged, ReportDetail, ReportRow, ReportTargetType } from './types';

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

// ── Moderation (8b) ──

export const useOpenReportCount = (enabled: boolean) =>
  useQuery({ queryKey: ['admin', 'reports', 'count'], queryFn: () => api<{ open: number }>('/admin/reports/count').then((d) => d.open), enabled, refetchInterval: 60_000 });

export type ReportFilters = { status: 'open' | 'resolved' | 'dismissed'; type?: ReportTargetType; page: number };
export function useReports(f: ReportFilters) {
  return useQuery({ queryKey: ['admin', 'reports', f], queryFn: () => api<Paged<'rows', ReportRow>>(`/admin/reports?${qs(f)}`), placeholderData: keepPreviousData });
}
export function useReportDetail(target: { type: ReportTargetType; id: string } | null) {
  return useQuery({
    queryKey: ['admin', 'report', target?.type, target?.id],
    queryFn: () => api<ReportDetail>(`/admin/reports/${target!.type}/${target!.id}`),
    enabled: !!target,
  });
}
export const useResolveReport = () =>
  useAdminMutation(({ type, id, action, note }: { type: ReportTargetType; id: string; action: 'dismiss' | 'remove' | 'warn' | 'ban'; note?: string }) =>
    api<{ resolved: number }>(`/admin/reports/${type}/${id}/resolve`, { method: 'POST', body: { action, note: note || undefined } }),
  );

export type ListFilters = { q?: string; featured?: 'true'; page: number };
export function useAdminPosts(f: ListFilters) {
  return useQuery({ queryKey: ['admin', 'posts', f], queryFn: () => api<Paged<'posts', AdminPost>>(`/admin/posts?${qs(f)}`), placeholderData: keepPreviousData });
}
export const usePostAction = () =>
  useAdminMutation(({ id, action, reason }: { id: string; action: 'feature' | 'unfeature' | 'unpublish' | 'delete'; reason?: string }) => {
    const body = { reason: reason || undefined };
    if (action === 'feature' || action === 'unfeature') return api(`/admin/posts/${id}`, { method: 'PATCH', body: { featured: action === 'feature' } });
    if (action === 'unpublish') return api(`/admin/posts/${id}/unpublish`, { method: 'POST', body });
    return api(`/admin/posts/${id}`, { method: 'DELETE', body });
  });
export const useBulkPosts = () =>
  useAdminMutation((body: { ids: string[]; action: 'feature' | 'unfeature' | 'unpublish' | 'delete'; reason?: string }) =>
    api<{ done: string[]; skipped: { id: string; reason: string }[] }>('/admin/posts/bulk', { method: 'POST', body }),
  );

export function useAdminCommunities(f: ListFilters) {
  return useQuery({ queryKey: ['admin', 'communities', f], queryFn: () => api<Paged<'communities', AdminCommunity>>(`/admin/communities?${qs(f)}`), placeholderData: keepPreviousData });
}
export const useCommunityAction = () =>
  useAdminMutation(({ id, action, reason }: { id: string; action: 'feature' | 'unfeature' | 'delete'; reason?: string }) =>
    action === 'delete'
      ? api(`/admin/communities/${id}`, { method: 'DELETE', body: { reason: reason || undefined } })
      : api(`/admin/communities/${id}`, { method: 'PATCH', body: { featured: action === 'feature' } }),
  );
export const useCommunityMembers = (id: string | null) =>
  useQuery({ queryKey: ['admin', 'community-members', id], queryFn: () => api<{ members: CommunityMember[] }>(`/admin/communities/${id}/members`).then((d) => d.members), enabled: !!id });
// Optimistic, so the role dropdown doesn't snap back while the change saves.
export function useSetCommunityRole() {
  const qc = useQueryClient();
  type Input = { id: string; userId: string; role: CommunityMember['role'] };
  return useMutation({
    mutationFn: ({ id, userId, role }: Input) => api(`/admin/communities/${id}/members/${userId}`, { method: 'PATCH', body: { role } }),
    onMutate: ({ id, userId, role }: Input) => {
      const key = ['admin', 'community-members', id];
      const before = qc.getQueryData<CommunityMember[]>(key);
      if (role !== 'owner') qc.setQueryData<CommunityMember[]>(key, (list) => list?.map((m) => (m.user.id === userId ? { ...m, role } : m)));
      return { key, before };
    },
    onError: (_e, _v, ctx) => ctx && qc.setQueryData(ctx.key, ctx.before),
    onSettled: () => void qc.invalidateQueries({ queryKey: adminKeys.all }),
  });
}
export const useRemoveCommunityMember = () =>
  useAdminMutation(({ id, userId }: { id: string; userId: string }) => api(`/admin/communities/${id}/members/${userId}`, { method: 'DELETE' }));
