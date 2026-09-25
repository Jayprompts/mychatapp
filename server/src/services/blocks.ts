import { Block } from '../models/Block.js';
import type { ConversationDoc } from '../models/Conversation.js';
import { AppError } from '../utils/AppError.js';

export type BlockState = 'byMe' | 'byThem' | null;

// Between two people: did I block them, did they block me (my block wins when both).
export async function blockBetween(me: string, other: string): Promise<BlockState> {
  const rows = await Block.find({ $or: [{ blocker: me, blocked: other }, { blocker: other, blocked: me }] }).select('blocker');
  if (rows.some((r) => r.blocker.toString() === me)) return 'byMe';
  return rows.length ? 'byThem' : null;
}

// Every block that involves me, both ways — for views and search.
export async function blocksInvolving(me: string) {
  const rows = await Block.find({ $or: [{ blocker: me }, { blocked: me }] }).select('blocker blocked');
  return {
    byMe: new Set(rows.filter((r) => r.blocker.toString() === me).map((r) => r.blocked.toString())),
    byThem: new Set(rows.filter((r) => r.blocked.toString() === me).map((r) => r.blocker.toString())),
  };
}

// 1-on-1 chats only: groups and communities aren't affected by a block.
export async function assertCanMessage(conversation: ConversationDoc, me: string) {
  if (conversation.type !== 'direct') return;
  const other = conversation.members.find((m) => m.user.toString() !== me)?.user.toString();
  if (!other) return;
  const state = await blockBetween(me, other);
  if (state === 'byMe') throw new AppError(403, 'You blocked this person. Unblock them to send messages.');
  if (state === 'byThem') throw new AppError(403, "You can't message this person.");
}
