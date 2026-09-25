import { Community, type CommunityDoc } from '../models/Community.js';
import type { ConversationDoc } from '../models/Conversation.js';
import { USER_SUMMARY_FIELDS, User, toUserSummary, type UserDoc, type UserSummary } from '../models/User.js';
import { isOnline } from './presence.js';

// Shapes conversations for one viewer: names the direct chat after the other person,
// attaches member profiles + online state, and exposes only the viewer's own unread count.

const deletedUser = (id: string): UserSummary => ({
  id,
  username: 'deleted',
  displayName: 'Deleted user',
  avatarUrl: null,
  lastSeenAt: null,
  online: false,
});

function toConversationView(
  c: ConversationDoc,
  viewerId: string,
  users: Map<string, UserDoc>,
  communities: Map<string, CommunityDoc>,
) {
  const members = c.members.map((m) => {
    const id = m.user.toString();
    const user = users.get(id);
    return {
      user: user ? toUserSummary(user, isOnline(id)) : deletedUser(id),
      role: m.role,
      lastReadAt: m.lastReadAt,
    };
  });

  const me = c.members.find((m) => m.user.toString() === viewerId);
  const other = c.type === 'direct' ? members.find((m) => m.user.id !== viewerId) : undefined;

  return {
    id: c._id.toString(),
    type: c.type,
    name: c.type === 'direct' ? (other?.user.displayName ?? 'Unknown user') : (c.name ?? 'Group'),
    avatarUrl: c.type === 'direct' ? (other?.user.avatarUrl ?? null) : (c.avatarUrl ?? null),
    description: c.type === 'group' ? (c.description ?? '') : '',
    myRole: me?.role ?? 'member',
    community: communityInfo(communities.get(c._id.toString())),
    members,
    lastMessage: c.lastMessage
      ? {
          id: c.lastMessage.messageId.toString(),
          senderId: c.lastMessage.sender.toString(),
          type: c.lastMessage.type,
          preview: c.lastMessage.preview,
          createdAt: c.lastMessage.createdAt,
          system: c.lastMessage.system ?? null,
        }
      : null,
    lastMessageAt: c.lastMessageAt,
    unreadCount: me?.unreadCount ?? 0,
    createdAt: c.createdAt,
  };
}

export type ConversationView = ReturnType<typeof toConversationView>;

// Just enough to draw a community chat (icon, theme) and link to its page.
function communityInfo(c?: CommunityDoc) {
  if (!c) return null;
  return {
    id: c._id.toString(),
    icon: c.icon,
    theme: c.theme,
    visibility: c.visibility,
    category: c.category,
    coverUrl: c.coverKey ? `/api/communities/${c._id.toString()}/cover?v=${c.updatedAt.getTime()}` : null,
  };
}

export async function buildConversationViews(conversations: ConversationDoc[], viewerId: string) {
  const ids = [...new Set(conversations.flatMap((c) => c.members.map((m) => m.user.toString())))];
  const users = await User.find({ _id: { $in: ids } }).select(USER_SUMMARY_FIELDS);
  const byId = new Map(users.map((u) => [u._id.toString(), u]));
  const communityConvs = conversations.filter((c) => c.type === 'community').map((c) => c._id);
  const communities = communityConvs.length ? await Community.find({ conversation: { $in: communityConvs } }) : [];
  const communityByConv = new Map(communities.map((cm) => [cm.conversation.toString(), cm]));
  return conversations.map((c) => toConversationView(c, viewerId, byId, communityByConv));
}

export async function buildConversationView(conversation: ConversationDoc, viewerId: string) {
  const [view] = await buildConversationViews([conversation], viewerId);
  return view;
}
