import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

export const CONVERSATION_TYPES = ['direct', 'group'] as const;
export const MEMBER_ROLES = ['owner', 'admin', 'member'] as const;

// Per-member state lives on the conversation, so the chat list needs one query (no counting messages).
const memberSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: MEMBER_ROLES, default: 'member' },
    lastReadAt: { type: Date, default: () => new Date(0) }, // drives "Seen" receipts
    unreadCount: { type: Number, default: 0 },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

// Denormalized copy of the newest message for the chat list preview.
const lastMessageSchema = new Schema(
  {
    messageId: { type: Schema.Types.ObjectId, required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    preview: { type: String, default: '' },
    createdAt: { type: Date, required: true },
  },
  { _id: false },
);

const conversationSchema = new Schema(
  {
    type: { type: String, enum: CONVERSATION_TYPES, required: true },
    // "<smallerUserId>:<largerUserId>" — guarantees one 1-on-1 conversation per pair of users
    directKey: { type: String },
    name: { type: String, trim: true, maxlength: 80 }, // groups only
    avatarUrl: { type: String, default: null }, // groups only
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: { type: [memberSchema], default: [] },
    lastMessage: { type: lastMessageSchema, default: null },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

conversationSchema.index({ directKey: 1 }, { unique: true, partialFilterExpression: { directKey: { $type: 'string' } } });
conversationSchema.index({ 'members.user': 1, lastMessageAt: -1 }); // "my chats, newest first"

export type ConversationDoc = HydratedDocument<InferSchemaType<typeof conversationSchema>>;

export const Conversation = model('Conversation', conversationSchema);

export function directKeyFor(userA: string, userB: string): string {
  return [userA, userB].sort().join(':');
}
