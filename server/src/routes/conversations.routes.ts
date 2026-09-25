import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import multer from 'multer';
import * as chat from '../controllers/conversations.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { MEDIA_LIMITS } from '../services/media.js';
import { openDirectSchema, sendMessageSchema } from '../validators/chat.schemas.js';

// Anti-spam: 30 messages per 10 seconds per user (normal chatting never gets close).
const sendLimiter = rateLimit({
  windowMs: 10_000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id.toString() ?? 'anonymous',
  handler: (_req, res) => {
    res.status(429).json({ success: false, error: { message: "You're sending messages too fast. Slow down a little." } });
  },
});

// Uploads are held in memory (max 12 MB), checked, then written to disk by services/media.ts.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MEDIA_LIMITS.uploadBytes, files: 1, fields: 10, fieldSize: 8 * 1024 },
});

const router = Router();

router.use(requireAuth);

router.get('/', chat.listConversations);
router.post('/direct', validate(openDirectSchema), chat.openDirectConversation);
router.get('/:id', chat.getConversation);
router.get('/:id/messages', chat.listMessages);
router.post('/:id/messages', sendLimiter, validate(sendMessageSchema), chat.sendMessage);
router.post('/:id/media', sendLimiter, upload.single('file'), chat.sendMediaMessage);
router.post('/:id/read', chat.markRead);

export default router;
