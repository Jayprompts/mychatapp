import { Block } from '../models/Block.js';
import { Bookmark } from '../models/Bookmark.js';
import { Comment } from '../models/Comment.js';
import { CommentLike } from '../models/CommentLike.js';
import { Community } from '../models/Community.js';
import { Conversation } from '../models/Conversation.js';
import { Post } from '../models/Post.js';
import { PostLike } from '../models/PostLike.js';
import { User, type UserDoc } from '../models/User.js';
import { disconnectUser, emitToUsers } from '../sockets/index.js';
import { removeComment } from './comments.js';
import { deleteMedia } from './media.js';
import { removeFromGroup } from './membership.js';
import { destroyPost } from './posts.js';

/**
 * Deleting an account. What goes: their posts (with comments, photos), their comments, likes, saves,
 * blocks, profile photo and group memberships (ownership passes on). What stays: messages they sent
 * in other people's chats, shown as "Deleted user" — like every messenger, the other person keeps
 * their conversation. The user record is anonymised (so email and username are free again).
 */
export async function deleteAccount(user: UserDoc) {
  const id = user._id;
  const userId = id.toString();

  // Groups & communities: leave like anyone else ("Ana left the group"), last one out deletes it.
  for (const group of await Conversation.find({ 'members.user': id, type: { $ne: 'direct' } })) {
    await removeFromGroup(group, userId, user, user);
  }
  await Community.updateMany({ 'joinRequests.user': id }, { $pull: { joinRequests: { user: id } } });

  for (const post of await Post.find({ author: id })) await destroyPost(post);
  for (const comment of await Comment.find({ author: id, deletedAt: null })) {
    const post = await Post.findById(comment.post);
    if (post) await removeComment(comment, post);
  }

  // Their likes come off other people's counts.
  for (const like of await PostLike.find({ user: id })) {
    await Post.updateOne({ _id: like.post }, { $inc: { likeCount: -1, engagement: -1 } });
  }
  for (const like of await CommentLike.find({ user: id })) {
    await Comment.updateOne({ _id: like.comment }, { $inc: { likeCount: -1 } });
  }
  await Promise.all([
    PostLike.deleteMany({ user: id }),
    CommentLike.deleteMany({ user: id }),
    Bookmark.deleteMany({ user: id }),
    Block.deleteMany({ $or: [{ blocker: id }, { blocked: id }] }),
  ]);
  if (user.avatarKey) await deleteMedia(user.avatarKey);

  await User.updateOne(
    { _id: id },
    {
      $set: {
        status: 'deleted',
        username: `deleted_${userId}`,
        email: `deleted+${userId}@deleted.invalid`,
        displayName: 'Deleted user',
        bio: '',
        website: '',
        location: '',
        avatarUrl: null,
        avatarKey: null,
        showOnlineStatus: false,
        lastSeenAt: null,
      },
      $unset: { passwordHash: 1 },
      $inc: { tokenVersion: 1 }, // every session ends
    },
  );

  // 1-on-1 partners: refresh the chat so it shows "Deleted user".
  const directs = await Conversation.find({ 'members.user': id, type: 'direct' }).select('members.user');
  for (const c of directs) {
    const others = c.members.map((m) => m.user.toString()).filter((u) => u !== userId);
    emitToUsers(others, 'conversation:updated', { conversationId: c._id.toString() });
  }
  disconnectUser(userId);
}
