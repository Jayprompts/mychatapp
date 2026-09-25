import type { UserSummary } from '@/features/chat/types';

export const POST_TAGS = ['Tech', 'Design', 'Product', 'Community', 'Lifestyle', 'News', 'Tutorial', 'Other'] as const;
export const POST_COVERS = ['grove', 'ocean', 'sunset', 'forest', 'berry', 'night'] as const;
export type PostTag = (typeof POST_TAGS)[number];
export type PostCoverTheme = (typeof POST_COVERS)[number];
export type PostStatus = 'draft' | 'published';
export type FeedSort = 'latest' | 'liked' | 'trending';
export const MAX_POST_IMAGES = 8;

export type PostCard = {
  id: string;
  title: string;
  excerpt: string;
  tag: PostTag;
  coverTheme: PostCoverTheme;
  coverUrl: string | null;
  status: PostStatus;
  featured: boolean;
  author: UserSummary | null;
  likeCount: number;
  commentCount: number;
  readMinutes: number;
  imageCount: number;
  liked: boolean;
  bookmarked: boolean;
  publishedAt: string | null;
  updatedAt: string;
};

export type PostImage = { id: string; url: string; width: number; height: number };

export type PostDetail = PostCard & {
  body: string;
  images: PostImage[];
  canEdit: boolean;
  canDelete: boolean;
  createdAt: string;
};

export type PostInput = Partial<{
  title: string;
  body: string;
  excerpt: string;
  tag: PostTag;
  coverTheme: PostCoverTheme;
  status: PostStatus;
  removeCover: true;
  imageOrder: string[];
}>;

export type CommentView = {
  id: string;
  postId: string;
  parentId: string | null;
  author: UserSummary | null; // null once deleted
  replyTo: { id: string; displayName: string; username: string } | null;
  body: string;
  deleted: boolean;
  likeCount: number;
  liked: boolean;
  editedAt: string | null;
  createdAt: string;
  canEdit: boolean;
  canDelete: boolean;
};
export type CommentThread = CommentView & { replies: CommentView[] };

export const REPORT_REASONS = ['Spam', 'Harassment', 'Misinformation', 'Hate speech', 'Violence', 'Other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
export type ReportTarget = { type: 'post' | 'comment' | 'user'; id: string };
