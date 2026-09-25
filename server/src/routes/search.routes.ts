import { Router } from 'express';
import { search } from '../controllers/search.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { searchLimiter } from '../middleware/rateLimit.js';

const router = Router();
router.get('/', requireAuth, searchLimiter, search);

export default router;
