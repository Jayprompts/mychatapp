import type { RequestHandler } from 'express';
import { z } from 'zod';
import { Community, newInviteCode } from '../models/Community.js';
import { Conversation, MAX_COMMUNITY_MEMBERS } from '../models/Conversation.js';
import { authUser } from '../middleware/auth.js';
import {
  adminIds,
  buildCommunityCards,
  buildCommunityDetail,
  communityConversation,
  destroyCommunityData,
  emitCommunityUpdated,
  findCommunity,
  isCommunityAdmin,
  roleIn,
  syncCommunity,
} from '../services/communities.js';
import { emitConversationUpdated, memberIds, postSystemEvent } from '../services/conversations.js';
import { deleteMedia, mediaPath, storeCover } from '../services/media.js';
import { emitToUsers } from '../sockets/index.js';
import { AppError } from '../utils/AppError.js';
import {
  discoverQuerySchema,
  type CreateCommunityInput,
  type UpdateCommunityInput,
} from '../validators/chat.schemas.js';
import { User, type UserDoc } from '../models/User.js';
import type { CommunityDoc } from '../models/Community.js';

const PAGE_SIZE = 24;
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function requireAdmin(c: CommunityDoc, userId: string) {
  const conversation = await communityConversation(c);
  const role = roleIn(conversation, userId);
  if (!isCommunityAdmin(role)) throw new AppError(403, 'Only community admins can do that');
  return { conversation, role };
}

// Adds a user to the community chat (join, approval, invite link) + "Ana joined the community".
async function addMember(c: CommunityDoc, user: UserDoc) {
  const conversation = await communityConversation(c);
  if (conversation.members.some((m) => m.user.equals(user._id))) return conversation;
  if (conversation.members.length >= MAX_COMMUNITY_MEMBERS) throw new AppError(400, 'This community is full');

  await Conversation.updateOne(
    { _id: conversation._id, 'members.user': { $ne: user._id } },
    { $push: { members: { user: user._id, role: 'member' } } },
  );
  await Community.updateOne({ _id: c._id }, { $pull: { joinRequests: { user: user._id } } });
  const updated = (await Conversation.findById(conversation._id))!;
  await syncCommunity(updated);
  await postSystemEvent(updated, user, { kind: 'joined' });
  emitConversationUpdated(updated);
  return updated;
}

// GET /api/communities/discover?q=&category=&page=
export const discover: RequestHandler = async (req, res) => {
  const me = authUser(req)._id.toString();
  const parsed = discoverQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new AppError(400, 'Validation failed', z.flattenError(parsed.error).fieldErrors);
  const { q, category, page } = parsed.data;

  const filter = {
    ...(category ? { category } : {}),
    ...(q ? { $or: [{ name: { $regex: escapeRegex(q), $options: 'i' } }, { description: { $regex: escapeRegex(q), $options: 'i' } }] } : {}),
  };
  const found = await Community.find(filter)
    .sort({ featured: -1, memberCount: -1, _id: -1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE + 1);

  res.json({
    success: true,
    data: { communities: await buildCommunityCards(found.slice(0, PAGE_SIZE), me), hasMore: found.length > PAGE_SIZE },
  });
};

// GET /api/communities/mine — communities I'm a member of
export const mine: RequestHandler = async (req, res) => {
  const me = authUser(req)._id;
  const convs = await Conversation.find({ type: 'community', 'members.user': me }).select('_id');
  const communities = await Community.find({ conversation: { $in: convs.map((c) => c._id) } }).sort({ name: 1 });
  res.json({ success: true, data: { communities: await buildCommunityCards(communities, me.toString()) } });
};

// POST /api/communities
export const create: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const input = req.body as CreateCommunityInput;

  const conversation = await Conversation.create({
    type: 'community',
    name: input.name,
    createdBy: me._id,
    members: [{ user: me._id, role: 'owner' }],
    lastMessageAt: new Date(),
  });
  let community: CommunityDoc;
  try {
    community = await Community.create({ ...input, owner: me._id, conversation: conversation._id });
  } catch (err) {
    await Conversation.deleteOne({ _id: conversation._id });
    throw err;
  }
  await Conversation.updateOne({ _id: conversation._id }, { $set: { community: community._id } });
  await postSystemEvent(conversation, me, { kind: 'created', name: input.name });

  res.status(201).json({ success: true, data: { community: await buildCommunityDetail(community, me._id.toString()) } });
};

// GET /api/communities/:id — anyone can see the public card; members get more.
export const get: RequestHandler = async (req, res) => {
  const me = authUser(req)._id.toString();
  const community = await findCommunity(req.params.id);
  res.json({ success: true, data: { community: await buildCommunityDetail(community, me) } });
};

// PATCH /api/communities/:id — admins
export const update: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const community = await findCommunity(req.params.id);
  const { conversation } = await requireAdmin(community, me._id.toString());
  const { removeCover, ...changes } = req.body as UpdateCommunityInput;

  const renamed = changes.name !== undefined && changes.name !== community.name;
  const oldCover = removeCover ? community.coverKey : null;
  community.set({ ...changes, ...(removeCover ? { coverKey: null } : {}) });
  await community.save();
  if (oldCover) await deleteMedia(oldCover);

  if (renamed) {
    await Conversation.updateOne({ _id: conversation._id }, { $set: { name: changes.name } });
    await postSystemEvent(conversation, me, { kind: 'renamed', name: changes.name });
  }
  emitConversationUpdated(conversation);
  emitCommunityUpdated(community._id.toString(), memberIds(conversation));
  res.json({ success: true, data: { community: await buildCommunityDetail(community, me._id.toString()) } });
};

// POST /api/communities/:id/cover (multipart "file") — admins
export const uploadCover: RequestHandler = async (req, res) => {
  const me = authUser(req)._id.toString();
  const community = await findCommunity(req.params.id);
  const { conversation } = await requireAdmin(community, me);
  if (!req.file) throw new AppError(400, 'No file uploaded');

  const key = await storeCover(req.file.buffer);
  const old = community.coverKey;
  community.coverKey = key;
  await community.save();
  if (old) await deleteMedia(old);

  emitCommunityUpdated(community._id.toString(), memberIds(conversation));
  res.json({ success: true, data: { community: await buildCommunityDetail(community, me) } });
};

// GET /api/communities/:id/cover — covers are public within the app (shown on Discover)
export const getCover: RequestHandler = async (req, res, next) => {
  const community = await findCommunity(req.params.id);
  if (!community.coverKey) throw new AppError(404, 'Not found');
  res.setHeader('Cache-Control', 'private, max-age=31536000, immutable'); // URL changes (?v=) when the cover does
  res.type('image/webp');
  res.sendFile(mediaPath(community.coverKey), (err) => err && !res.headersSent && next(new AppError(404, 'Not found')));
};

// DELETE /api/communities/:id — owner only; removes everything
export const remove: RequestHandler = async (req, res) => {
  const me = authUser(req)._id.toString();
  const community = await findCommunity(req.params.id);
  const conversation = await communityConversation(community);
  if (roleIn(conversation, me) !== 'owner') throw new AppError(403, 'Only the owner can delete the community');

  const everyone = memberIds(conversation);
  await destroyCommunityData(conversation._id);
  emitToUsers(everyone, 'conversation:removed', { conversationId: conversation._id.toString() });
  emitCommunityUpdated(community._id.toString(), everyone);
  res.json({ success: true, data: { deleted: true } });
};

// POST /api/communities/:id/join — public: join now · private: ask to join
export const join: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const meId = me._id.toString();
  const community = await findCommunity(req.params.id);
  const conversation = await communityConversation(community);

  if (!roleIn(conversation, meId)) {
    if (community.visibility === 'public') {
      await addMember(community, me);
    } else if (!community.joinRequests.some((r) => r.user.equals(me._id))) {
      await Community.updateOne(
        { _id: community._id, 'joinRequests.user': { $ne: me._id } },
        { $push: { joinRequests: { user: me._id } } },
      );
      emitCommunityUpdated(community._id.toString(), await adminIds(conversation)); // admins see it right away
    }
  }
  const fresh = (await Community.findById(community._id))!;
  res.json({ success: true, data: { community: await buildCommunityDetail(fresh, meId) } });
};

// DELETE /api/communities/:id/join — cancel my pending request
export const cancelRequest: RequestHandler = async (req, res) => {
  const me = authUser(req)._id;
  const community = await findCommunity(req.params.id);
  await Community.updateOne({ _id: community._id }, { $pull: { joinRequests: { user: me } } });
  const conversation = await communityConversation(community);
  emitCommunityUpdated(community._id.toString(), await adminIds(conversation));
  const fresh = (await Community.findById(community._id))!;
  res.json({ success: true, data: { community: await buildCommunityDetail(fresh, me.toString()) } });
};

// POST /api/communities/:id/requests/:userId/(approve|reject) — admins
export const answerRequest =
  (approve: boolean): RequestHandler =>
  async (req, res) => {
    const me = authUser(req)._id.toString();
    const community = await findCommunity(req.params.id);
    const { conversation } = await requireAdmin(community, me);
    const request = community.joinRequests.find((r) => r.user.toString() === req.params.userId);
    if (!request) throw new AppError(404, 'That request no longer exists');

    if (approve) {
      const user = await User.findById(request.user);
      if (user && user.status === 'active') await addMember(community, user);
      else await Community.updateOne({ _id: community._id }, { $pull: { joinRequests: { user: request.user } } });
    } else {
      await Community.updateOne({ _id: community._id }, { $pull: { joinRequests: { user: request.user } } });
    }

    emitCommunityUpdated(community._id.toString(), [...(await adminIds(conversation)), request.user.toString()]);
    const fresh = (await Community.findById(community._id))!;
    res.json({ success: true, data: { community: await buildCommunityDetail(fresh, me) } });
  };

// POST /api/communities/:id/invite/reset — admins: new link (old one stops working)
export const resetInvite: RequestHandler = async (req, res) => {
  const me = authUser(req)._id.toString();
  const community = await findCommunity(req.params.id);
  await requireAdmin(community, me);
  community.inviteCode = newInviteCode();
  await community.save();
  res.json({ success: true, data: { community: await buildCommunityDetail(community, me) } });
};

async function findByInvite(code: unknown) {
  if (typeof code !== 'string' || !/^[A-Za-z0-9_-]{6,16}$/.test(code)) throw new AppError(404, 'This invite link is invalid or has expired');
  const community = await Community.findOne({ inviteCode: code });
  if (!community) throw new AppError(404, 'This invite link is invalid or has expired');
  return community;
}

// GET /api/communities/invite/:code — preview for the invite page
export const invitePreview: RequestHandler = async (req, res) => {
  const me = authUser(req)._id.toString();
  const community = await findByInvite(req.params.code);
  res.json({ success: true, data: { community: await buildCommunityDetail(community, me) } });
};

// POST /api/communities/invite/:code/join — an invite link lets you in, even to a private community
export const joinByInvite: RequestHandler = async (req, res) => {
  const me = authUser(req);
  const community = await findByInvite(req.params.code);
  await addMember(community, me);
  const fresh = (await Community.findById(community._id))!;
  res.json({ success: true, data: { community: await buildCommunityDetail(fresh, me._id.toString()) } });
};
