import { Router } from 'express';
import * as notifications from '../controllers/notifications.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', notifications.list);
router.get('/unread-count', notifications.count);
router.post('/read-all', notifications.markAllRead);
router.post('/:id/read', notifications.markRead);

export default router;
