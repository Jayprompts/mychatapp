import type { RequestHandler } from 'express';
import { Community } from '../models/Community.js';
import { Conversation, MAX_COMMUNITY_MEMBERS, MAX_GROUP_MEMBERS, type ConversationDoc } from '../models/Conversation.js';
import { User } from '../models/User.js';
import { authUser } from '../middleware/auth.js';
import { buildConversationView } from '../services/conversationView.js';
import {
  emitConversationUpdated,
  findMemberConversation,
  person,
  postSystemEvent,
  roleOf,
} from '../services/conversations.js';
import { syncCommunity } from '../services/communities.js';
import { removeFromGroup } from '../services/membership.js';
import { AppError } from '../utils/AppError.js';
import { parseObjectId } from '../utils/objectId.js';
import type { AddMembersInput, CreateGroupInput, SetRoleInput, UpdateGroupInput } from '../validators/chat.schemas.js';

// Group permissions (Messenger-style):
//   any member   → add people, leave
//   owner/admin  → rename / edit description, remove members (admins can't remove other admins)
//   owner        → promote / demote admins; can't be removed. If the owner leaves, ownership passes on.

const isAdmin = (role?: string) => role === 'owner' || role === 'admin';

// Groups and community chats share member management (add / remove / leave / roles).
async function findGroup(id: unknown, userId: string): Promise<ConversationDoc> {
  const conversation = await findMemberConversation(id, userId);
  if (conversation.type === 'direct') throw new AppError(400, 'This is not a group chat');
  return conversation;
}
const maxMembers = (c: ConversationDoc) => (c.type === 'community' ? MAX_COMMUNITY_MEMBERS : MAX_GROUP_MEMBERS);

async function reload(id: unknown): Promise<ConversationDoc> {
  const conversation = await Conversation.findById(id);
  if (!conversation) throw new AppError(404, 'Conversation not found');
  return conversation;
}

async function activeUsers(ids: string[]) {
  const users = await User.find({ _id: { $in: ids }, status: 'active' });
  if (users.length !== ids.length) throw new AppError(400, 'Some of those people could not be found');
  return users;
}

// POST /api/conversations/group { name, description?, memberIds }
export const createGroup: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const meId = me._id.toString();
  const { name, description, memberIds } = req.body as CreateGroupInput;

  const others = memberIds.filter((id) => id !== meId);
  if (others.length === 0) throw new AppError(400, 'Pick at least one person to add');
  if (others.length + 1 > MAX_GROUP_MEMBERS) throw new AppError(400, `Groups can have up to ${MAX_GROUP_MEMBERS} members`);
  const users = await activeUsers(others);

  const conversation = await Conversation.create({
    type: 'group',
    name,
    description: description ?? '',
    createdBy: me._id,
    members: [{ user: me._id, role: 'owner' }, ...users.map((u) => ({ user: u._id, role: 'member' }))],
    lastMessageAt: new Date(),
  });
  await postSystemEvent(conversation, me, { kind: 'created', name, targets: users.map(person) });

  res.status(201).json({ success: true, data: { conversation: await buildConversationView(await reload(conversation._id), meId) } });
};

// PATCH /api/conversations/:id { name?, description? } — owner/admin
export const updateGroup: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const meId = me._id.toString();
  const group = await findGroup(req.params.id, meId);
  if (group.type === 'community') throw new AppError(400, 'Edit communities from their settings');
  if (!isAdmin(roleOf(group, meId))) throw new AppError(403, 'Only group admins can edit the group');

  const { name, description } = req.body as UpdateGroupInput;
  const renamed = name !== undefined && name !== group.name;
  await Conversation.updateOne(
    { _id: group._id },
    { $set: { ...(name !== undefined ? { name } : {}), ...(description !== undefined ? { description } : {}) } },
  );

  const updated = await reload(group._id);
  if (renamed) await postSystemEvent(updated, me, { kind: 'renamed', name });
  emitConversationUpdated(updated);
  res.json({ success: true, data: { conversation: await buildConversationView(updated, meId) } });
};

// POST /api/conversations/:id/members { userIds } — any member can add people
export const addMembers: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const meId = me._id.toString();
  const group = await findGroup(req.params.id, meId);

  if (group.type === 'community') {
    const community = await Community.findOne({ conversation: group._id }).select('visibility');
    if (community?.visibility === 'private' && !isAdmin(roleOf(group, meId))) {
      throw new AppError(403, 'Only admins can add people to a private community');
    }
  }

  const existing = new Set(group.members.map((m) => m.user.toString()));
  const newIds = (req.body as AddMembersInput).userIds.filter((id) => !existing.has(id));
  if (newIds.length === 0) throw new AppError(400, 'Everyone you picked is already in the group');
  if (existing.size + newIds.length > maxMembers(group)) {
    throw new AppError(400, `This chat can have up to ${maxMembers(group)} members`);
  }
  const users = await activeUsers(newIds);

  // The filter makes this safe if two people add the same person at the same moment.
  await Conversation.updateOne(
    { _id: group._id, 'members.user': { $nin: newIds } },
    { $push: { members: { $each: users.map((u) => ({ user: u._id, role: 'member' })) } } },
  );

  const updated = await reload(group._id);
  if (updated.type === 'community') {
    await syncCommunity(updated);
    await Community.updateOne({ conversation: updated._id }, { $pull: { joinRequests: { user: { $in: newIds } } } });
  }
  await postSystemEvent(updated, me, { kind: 'added', targets: users.map(person) }); // new members see this first
  emitConversationUpdated(updated);
  res.json({ success: true, data: { conversation: await buildConversationView(updated, meId) } });
};

// DELETE /api/conversations/:id/members/:userId — leave (yourself) or remove someone (admins)
export const removeMember: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const meId = me._id.toString();
  const targetId = parseObjectId(req.params.userId, 'user id');
  const group = await findGroup(req.params.id, meId);

  const leaving = targetId === meId;
  const myRole = roleOf(group, meId);
  const targetRole = roleOf(group, targetId);
  if (!targetRole) throw new AppError(404, "That person isn't in this group");
  if (!leaving) {
    if (!isAdmin(myRole)) throw new AppError(403, 'Only group admins can remove people');
    if (targetRole === 'owner') throw new AppError(403, "The group owner can't be removed");
    if (targetRole === 'admin' && myRole !== 'owner') throw new AppError(403, 'Only the owner can remove an admin');
  }

  const target = leaving ? me : await User.findById(targetId);
  const { deleted } = await removeFromGroup(group, targetId, target, me);
  res.json({ success: true, data: { deleted } });
};

// PATCH /api/conversations/:id/members/:userId { role: 'admin' | 'member' } — owner only
export const setMemberRole: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const meId = me._id.toString();
  const targetId = parseObjectId(req.params.userId, 'user id');
  const group = await findGroup(req.params.id, meId);
  const { role } = req.body as SetRoleInput;

  if (roleOf(group, meId) !== 'owner') throw new AppError(403, 'Only the group owner can change roles');
  const current = roleOf(group, targetId);
  if (!current) throw new AppError(404, "That person isn't in this group");
  if (current === 'owner') throw new AppError(400, "The owner's role can't be changed");

  const target = await User.findById(targetId);
  if (current !== role) {
    await Conversation.updateOne({ _id: group._id, 'members.user': targetId }, { $set: { 'members.$.role': role } });
  }
  const updated = await reload(group._id);
  if (current !== role && target) await postSystemEvent(updated, me, { kind: 'role', targets: [person(target)], role });
  emitConversationUpdated(updated);
  res.json({ success: true, data: { conversation: await buildConversationView(updated, meId) } });
};
