import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import * as chat from '../controllers/conversations.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
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

const router = Router();

router.use(requireAuth);

router.get('/', chat.listConversations);
router.post('/direct', validate(openDirectSchema), chat.openDirectConversation);
router.get('/:id', chat.getConversation);
router.get('/:id/messages', chat.listMessages);
router.post('/:id/messages', sendLimiter, validate(sendMessageSchema), chat.sendMessage);
router.post('/:id/read', chat.markRead);

export default router;
