import { Conversation, type ConversationDoc } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import type { UserDoc } from '../models/User.js';
import { emitToUsers } from '../sockets/index.js';
import { AppError } from '../utils/AppError.js';
import { destroyCommunityData, syncCommunity } from './communities.js';
import { emitConversationUpdated, person, postSystemEvent } from './conversations.js';
import { deleteMedia } from './media.js';

async function reload(id: unknown): Promise<ConversationDoc> {
  const conversation = await Conversation.findById(id);
  if (!conversation) throw new AppError(404, 'Conversation not found');
  return conversation;
}

/**
 * Someone leaves (actor = target) or is removed from a group / community chat. Permission checks are
 * the caller's job. Last person out deletes it; if the owner goes, ownership passes on.
 * Shared by "Leave", "Remove member" and account deletion.
 */
export async function removeFromGroup(group: ConversationDoc, targetId: string, target: UserDoc | null, actor: UserDoc) {
  const leaving = targetId === actor._id.toString();
  await Conversation.updateOne({ _id: group._id }, { $pull: { members: { user: targetId } } });
  let updated = await reload(group._id);

  // Last person out: delete the group (or community), its messages and files.
  if (updated.members.length === 0) {
    if (updated.type === 'community') {
      await destroyCommunityData(group._id);
    } else {
      const withMedia = await Message.find({ conversation: group._id, media: { $ne: null } }).select('media');
      await Promise.all(withMedia.map((m) => (m.media ? deleteMedia(m.media.key) : null)));
      await Message.deleteMany({ conversation: group._id });
      await Conversation.deleteOne({ _id: group._id });
    }
    emitToUsers([targetId], 'conversation:removed', { conversationId: group._id.toString() });
    return { deleted: true };
  }

  // The owner left: hand the group to the longest-serving admin, otherwise the longest-serving member.
  if (!updated.members.some((m) => m.role === 'owner')) {
    const byJoin = [...updated.members].sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());
    const heir = byJoin.find((m) => m.role === 'admin') ?? byJoin[0];
    await Conversation.updateOne({ _id: group._id, 'members.user': heir.user }, { $set: { 'members.$.role': 'owner' } });
    updated = await reload(group._id);
  }
  await syncCommunity(updated); // member count / owner (no-op for groups)

  if (leaving) await postSystemEvent(updated, actor, { kind: 'left' });
  else if (target) await postSystemEvent(updated, actor, { kind: 'removed', targets: [person(target)] });

  emitToUsers([targetId], 'conversation:removed', { conversationId: group._id.toString() });
  emitConversationUpdated(updated);
  return { deleted: false };
}
