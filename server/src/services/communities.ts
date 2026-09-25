import { Community, type CommunityDoc } from '../models/Community.js';
import { Conversation, type ConversationDoc } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { USER_SUMMARY_FIELDS, User, toUserSummary } from '../models/User.js';
import { emitToUsers } from '../sockets/index.js';
import { AppError } from '../utils/AppError.js';
import { parseObjectId } from '../utils/objectId.js';
import { deleteMedia } from './media.js';
import { isOnline } from './presence.js';

export type MyStatus = 'member' | 'requested' | 'none';

export const coverUrlFor = (c: CommunityDoc) =>
  c.coverKey ? `/api/communities/${c._id.toString()}/cover?v=${c.updatedAt.getTime()}` : null;

export async function findCommunity(id: unknown): Promise<CommunityDoc> {
  const community = await Community.findById(parseObjectId(id, 'community id'));
  if (!community) throw new AppError(404, 'Community not found');
  return community;
}

export async function communityConversation(c: CommunityDoc): Promise<ConversationDoc> {
  const conversation = await Conversation.findById(c.conversation);
  if (!conversation) throw new AppError(404, 'Community not found');
  return conversation;
}

export function roleIn(conversation: ConversationDoc, userId: string) {
  return conversation.members.find((m) => m.user.toString() === userId)?.role;
}
export const isCommunityAdmin = (role?: string) => role === 'owner' || role === 'admin';

// Card for Discover / previews. `members` = the conversation's member ids (for online count + my status).
export function toCommunityCard(c: CommunityDoc, viewerId: string, memberIds: string[]) {
  const isMember = memberIds.includes(viewerId);
  const requested = c.joinRequests.some((r) => r.user.toString() === viewerId);
  return {
    id: c._id.toString(),
    name: c.name,
    description: c.description,
    category: c.category,
    visibility: c.visibility,
    icon: c.icon,
    theme: c.theme,
    coverUrl: coverUrlFor(c),
    memberCount: c.memberCount,
    onlineCount: memberIds.filter(isOnline).length,
    featured: c.featured,
    myStatus: (isMember ? 'member' : requested ? 'requested' : 'none') as MyStatus,
    conversationId: isMember ? c.conversation.toString() : null, // only members get into the chat
    createdAt: c.createdAt,
  };
}
export type CommunityCard = ReturnType<typeof toCommunityCard>;

export async function buildCommunityCards(communities: CommunityDoc[], viewerId: string) {
  const convs = await Conversation.find({ _id: { $in: communities.map((c) => c.conversation) } }).select('members.user');
  const membersOf = new Map(convs.map((cv) => [cv._id.toString(), cv.members.map((m) => m.user.toString())]));
  return communities.map((c) => toCommunityCard(c, viewerId, membersOf.get(c.conversation.toString()) ?? []));
}

// Full detail: card + my role, and (admins only) the pending join requests and invite code.
export async function buildCommunityDetail(c: CommunityDoc, viewerId: string) {
  const conversation = await communityConversation(c);
  const memberIds = conversation.members.map((m) => m.user.toString());
  const myRole = roleIn(conversation, viewerId) ?? null;
  const admin = isCommunityAdmin(myRole ?? undefined);

  let joinRequests: { user: ReturnType<typeof toUserSummary>; requestedAt: Date }[] = [];
  if (admin && c.joinRequests.length) {
    const users = await User.find({ _id: { $in: c.joinRequests.map((r) => r.user) } }).select(USER_SUMMARY_FIELDS);
    const byId = new Map(users.map((u) => [u._id.toString(), u]));
    joinRequests = c.joinRequests
      .map((r) => ({ u: byId.get(r.user.toString()), requestedAt: r.requestedAt }))
      .filter((r) => r.u)
      .map((r) => ({ user: toUserSummary(r.u!, isOnline(r.u!._id.toString())), requestedAt: r.requestedAt }));
  }

  return {
    ...toCommunityCard(c, viewerId, memberIds),
    myRole,
    inviteCode: myRole ? c.inviteCode : null, // members can share the link
    joinRequests, // admins only
  };
}

// Tell users to refetch a community (join requests, approvals, edits…).
export function emitCommunityUpdated(communityId: string, userIds: string[]) {
  emitToUsers([...new Set(userIds)], 'community:updated', { communityId });
}

export async function adminIds(conversation: ConversationDoc) {
  return conversation.members.filter((m) => isCommunityAdmin(m.role)).map((m) => m.user.toString());
}

// Keep the community's member count / owner in step with its conversation (after joins, leaves, removals).
export async function syncCommunity(conversation: ConversationDoc) {
  if (conversation.type !== 'community') return;
  const owner = conversation.members.find((m) => m.role === 'owner');
  await Community.updateOne(
    { conversation: conversation._id },
    { $set: { memberCount: conversation.members.length, ...(owner ? { owner: owner.user } : {}) } },
  );
}

// Owner deletes the community (or the last member leaves): chat, messages, files, cover — everything.
export async function destroyCommunityData(conversationId: ConversationDoc['_id']) {
  const community = await Community.findOne({ conversation: conversationId });
  const withMedia = await Message.find({ conversation: conversationId, media: { $ne: null } }).select('media');
  await Promise.all([
    ...withMedia.map((m) => (m.media ? deleteMedia(m.media.key) : null)),
    community?.coverKey ? deleteMedia(community.coverKey) : null,
  ]);
  await Message.deleteMany({ conversation: conversationId });
  await Conversation.deleteOne({ _id: conversationId });
  if (community) await Community.deleteOne({ _id: community._id });
}
