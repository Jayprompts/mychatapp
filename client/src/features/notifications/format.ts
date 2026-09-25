import type { AppNotification } from './types';

// How each notification reads, and where tapping it goes.
export function describe(n: AppNotification): { who: string; action: string; quote: string | null; href: string } {
  const first = n.actors[0]?.displayName ?? 'Someone';
  const others = n.actorCount - 1;
  const who = others > 0 ? `${first} and ${others} ${others === 1 ? 'other' : 'others'}` : first;
  const post = n.postId ? `/blog/${n.postId}${n.commentId ? `#comment-${n.commentId}` : ''}` : null;
  const place = n.communityId ? `/communities/${n.communityId}` : n.conversationId ? `/chats/${n.conversationId}` : '/chats';
  const quote = n.preview || null;
  const t = n.title ? `“${n.title}”` : 'your post';

  switch (n.type) {
    case 'post_like':
      return { who, action: `liked your post ${t}`, quote: null, href: post ?? '/blog' };
    case 'post_comment':
      return { who, action: `commented on ${t}`, quote, href: post ?? '/blog' };
    case 'comment_reply':
      return { who, action: 'replied to your comment', quote, href: post ?? '/blog' };
    case 'comment_like':
      return { who, action: 'liked your comment', quote, href: post ?? '/blog' };
    case 'mention':
      return post
        ? { who, action: `mentioned you in a comment on ${t}`, quote, href: post }
        : { who, action: `mentioned you in ${n.title || 'a chat'}`, quote, href: place };
    case 'community_join':
      return { who, action: `joined ${n.title}`, quote: null, href: place };
    case 'community_request':
      return { who, action: `asked to join ${n.title}`, quote: null, href: place };
    case 'request_approved':
      return { who, action: `approved your request to join ${n.title} 🎉`, quote: null, href: place };
    case 'group_added':
      return { who, action: `added you to ${n.title || 'a group'}`, quote: null, href: place };
  }
}
