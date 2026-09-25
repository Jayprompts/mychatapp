import type { UserSummary } from '@/features/chat/types';

export const COMMUNITY_CATEGORIES = ['Design', 'Tech', 'Gaming', 'Sports', 'Music', 'Art', 'Education', 'Business', 'Lifestyle', 'Other'] as const;
export type CommunityCategory = (typeof COMMUNITY_CATEGORIES)[number];

export const COMMUNITY_THEMES = ['grove', 'ocean', 'sunset', 'forest', 'berry', 'night'] as const;
export type CommunityTheme = (typeof COMMUNITY_THEMES)[number];

export const COMMUNITY_ICONS = ['🌱', '🎨', '💻', '🎮', '⚽', '🎵', '📚', '💼', '✈️', '🍳', '📷', '🧪', '🚀', '🌍', '❤️', '🔥'];

export type MyStatus = 'member' | 'requested' | 'none';

export type CommunityCard = {
  id: string;
  name: string;
  description: string;
  category: CommunityCategory;
  visibility: 'public' | 'private';
  icon: string;
  theme: CommunityTheme;
  coverUrl: string | null;
  memberCount: number;
  onlineCount: number;
  featured: boolean;
  myStatus: MyStatus;
  conversationId: string | null; // only for members
  createdAt: string;
};

export type CommunityDetail = CommunityCard & {
  myRole: 'owner' | 'admin' | 'member' | null;
  inviteCode: string | null; // members only
  joinRequests: { user: UserSummary; requestedAt: string }[]; // admins only
};
