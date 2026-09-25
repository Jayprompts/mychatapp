import { z } from 'zod';
import { email, password, username } from './auth.schemas.js';

const website = z
  .string()
  .trim()
  .max(100, 'Website is too long')
  .transform((v) => v.replace(/^https?:\/\//i, '').replace(/\/$/, '')) // stored without the scheme
  .refine((v) => v === '' || /^[a-z0-9.-]+\.[a-z]{2,}(\/\S*)?$/i.test(v), 'Enter a website like yoursite.com');

export const updateProfileSchema = z
  .object({
    displayName: z.string().trim().min(1, 'Your name is required').max(50, 'Name is too long'),
    username,
    bio: z.string().trim().max(160, 'Bio is too long (max 160 characters)'),
    website,
    location: z.string().trim().max(60, 'Location is too long'),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

export const changeEmailSchema = z.object({ email, password: z.string().min(1, 'Enter your password') });
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1, 'Enter your current password'), newPassword: password });
export const privacySchema = z.object({ showOnlineStatus: z.boolean() });
export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Enter your password'),
  confirm: z.literal('DELETE', { error: 'Type DELETE to confirm' }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const notificationPrefsSchema = z
  .object({ messages: z.boolean(), social: z.boolean(), communities: z.boolean() })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');
