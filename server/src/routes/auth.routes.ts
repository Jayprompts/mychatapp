import { Router } from 'express';
import * as auth from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginLimiter, registerLimiter } from '../middleware/rateLimit.js';
import { loginSchema, registerSchema } from '../validators/auth.schemas.js';

const router = Router();

router.post('/register', registerLimiter, validate(registerSchema), auth.register);
router.post('/login', loginLimiter, validate(loginSchema), auth.login);
router.post('/logout', auth.logout);
router.post('/logout-all', requireAuth, auth.logoutAll);
router.get('/me', requireAuth, auth.me);

export default router;
