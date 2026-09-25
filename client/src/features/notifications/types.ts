import type { UserSummary } from '@/features/chat/types';

export type NotificationType =
  | 'post_like'
  | 'post_comment'
  | 'comment_reply'
  | 'comment_like'
  | 'mention'
  | 'community_join'
  | 'community_request'
  | 'request_approved'
  | 'group_added';

// ("AppNotification" so it doesn't clash with the browser's own Notification.)
export type AppNotification = {
  id: string;
  type: NotificationType;
  actors: UserSummary[]; // newest first, up to 3
  actorCount: number;
  postId: string | null;
  commentId: string | null;
  communityId: string | null;
  conversationId: string | null;
  title: string;
  preview: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
};
