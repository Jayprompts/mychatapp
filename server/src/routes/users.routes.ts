import { Router } from 'express';
import multer from 'multer';
import { updatePrefs } from '../controllers/notifications.controller.js';
import * as profile from '../controllers/profile.controller.js';
import { searchUsers } from '../controllers/users.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { sensitiveLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { MEDIA_LIMITS } from '../services/media.js';
import {
  changeEmailSchema,
  changePasswordSchema,
  deleteAccountSchema,
  notificationPrefsSchema,
  privacySchema,
  updateProfileSchema,
} from '../validators/profile.schemas.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MEDIA_LIMITS.uploadBytes, files: 1 } });
const router = Router();
router.use(requireAuth);

router.get('/search', searchUsers);

// My account (before /:username so "me" isn't read as a username)
router.patch('/me', validate(updateProfileSchema), profile.updateMe);
router.delete('/me', sensitiveLimiter, validate(deleteAccountSchema), profile.removeAccount);
router.post('/me/avatar', upload.single('file'), profile.uploadAvatar);
router.delete('/me/avatar', profile.removeAvatar);
router.patch('/me/email', sensitiveLimiter, validate(changeEmailSchema), profile.changeEmail);
router.patch('/me/password', sensitiveLimiter, validate(changePasswordSchema), profile.changePassword);
router.patch('/me/privacy', validate(privacySchema), profile.updatePrivacy);
router.get('/me/blocks', profile.listBlocks);
router.patch('/me/notifications', validate(notificationPrefsSchema), updatePrefs);

router.get('/:id/avatar', profile.getAvatar);
router.post('/:id/block', profile.block);
router.delete('/:id/block', profile.unblock);
router.get('/:username', profile.getProfile);

export default router;
