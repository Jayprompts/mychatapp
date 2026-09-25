import { Router } from 'express';
import { getMedia } from '../controllers/media.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/:messageId', requireAuth, getMedia);

export default router;
