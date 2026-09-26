import type { UserSummary } from '@/features/chat/types';
import type { CommunityTheme } from '@/features/communities/types';
import type { PostCoverTheme, PostTag } from '@/features/blog/types';
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

// ── Moderation ──

export type ReportTargetType = 'post' | 'comment' | 'message' | 'user';
export type ReportRow = {
  targetType: ReportTargetType;
  targetId: string;
  count: number;
  reasons: { reason: string; count: number }[];
  latest: string;
  snapshot: string;
  author: UserSummary | null;
  resolution: 'dismissed' | 'removed' | 'warned' | 'banned' | null;
  resolvedAt: string | null;
};
export type ReportAuthor = UserSummary & { email: string; role: Role; status: string; statusReason: string; createdAt: string; bio: string };
export type ReportContent =
  | { kind: 'post'; id: string; title: string; body: string; coverUrl: string | null; coverTheme: PostCoverTheme; status: string; publishedAt: string | null; url: string }
  | { kind: 'comment'; id: string; body: string; createdAt: string; post: { id: string; title: string } | null; parent: { author: ReportAuthor | null; body: string } | null; url: string }
  | { kind: 'message'; id: string; conversation: { id: string; type: string; name: string } | null; context: { id: string; sender: string; text: string; createdAt: string; isTarget: boolean }[] }
  | { kind: 'user'; id: string; posts: number };
export type ReportDetail = {
  type: ReportTargetType;
  id: string;
  exists: boolean;
  label: string;
  author: ReportAuthor | null;
  content: ReportContent | null;
  priorAboutAuthor: number;
  reports: { id: string; reporter: UserSummary | null; reason: string; details: string; snapshot: string; status: string; resolution: string | null; note: string; createdAt: string }[];
};

export type AdminPost = {
  id: string;
  title: string;
  tag: PostTag;
  coverUrl: string | null;
  coverTheme: PostCoverTheme;
  author: UserSummary | null;
  publishedAt: string;
  likeCount: number;
  commentCount: number;
  featured: boolean;
};
export type AdminCommunity = {
  id: string;
  name: string;
  icon: string;
  theme: CommunityTheme;
  category: string;
  visibility: 'public' | 'private';
  memberCount: number;
  featured: boolean;
  createdAt: string;
  owner: UserSummary | null;
  admins: number;
};
export type CommunityMember = { user: UserSummary; role: 'owner' | 'admin' | 'member'; joinedAt: string };
