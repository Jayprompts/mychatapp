import { z } from 'zod';

// What PushManager.subscribe() gives the browser (subscription.toJSON()).
export const pushSubscriptionSchema = z.object({
  endpoint: z.url().max(1000),
  keys: z.object({
    p256dh: z.string().min(20).max(200),
    auth: z.string().min(8).max(100),
  }),
});

export const pushUnsubscribeSchema = z.object({ endpoint: z.url().max(1000) });

export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;
