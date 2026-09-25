import type { Role } from '@/features/auth/types';

export type Profile = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  lastSeenAt: string | null;
  online: boolean;
  bio: string;
  website: string;
  location: string;
  role: Role;
  createdAt: string;
  stats: { communities: number; posts: number; likes: number };
  isMe: boolean;
  blocked: 'byMe' | 'byThem' | null;
};
