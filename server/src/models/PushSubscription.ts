import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

// One row per browser/device that turned on push notifications. The endpoint is the device's unique
// address at its push service (Google, Mozilla, Apple…); keys encrypt what we send so only it can read it.
const pushSubscriptionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    userAgent: { type: String, default: '', maxlength: 300 },
  },
  { timestamps: true },
);

export type PushSubscriptionDoc = HydratedDocument<InferSchemaType<typeof pushSubscriptionSchema>>;
export const PushSubscription = model('PushSubscription', pushSubscriptionSchema);
