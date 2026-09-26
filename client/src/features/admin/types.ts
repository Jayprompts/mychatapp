import type { Role } from '@/features/auth/types';

export type AdminUser = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  role: Role;
  status: 'active' | 'suspended' | 'banned';
  statusReason: string;
  createdAt: string;
  lastSeenAt: string | null;
  online: boolean;
};

export type AuditEntry = {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  targetType: 'user' | 'post' | 'comment' | 'message' | 'community' | 'report';
  targetId: string;
  targetLabel: string;
  details: Record<string, unknown> | null;
  createdAt: string;
};

export type AdminStats = {
  users: { total: number; newThisWeek: number; newLastWeek: number; blocked: number };
  communities: { total: number; active: number };
  posts: { thisWeek: number; lastWeek: number };
  reports: { open: number };
  recent: AuditEntry[];
};

export type Paged<K extends string, T> = { [key in K]: T[] } & { total: number; page: number; pageSize: number };

export const STAFF_ROLES: Role[] = ['super_admin', 'content_mod', 'community_mgr'];
export const isStaff = (role?: Role) => !!role && STAFF_ROLES.includes(role);
export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'Super Admin',
  content_mod: 'Content Moderator',
  community_mgr: 'Community Manager',
  user: 'User',
};
