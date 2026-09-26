import { Router } from 'express';
import * as auth from '../controllers/auth.controller.js';
import * as oauth from '../controllers/oauth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginLimiter, oauthSignupLimiter, registerLimiter } from '../middleware/rateLimit.js';
import { completeOAuthSchema, loginSchema, registerSchema } from '../validators/auth.schemas.js';

const router = Router();

router.post('/register', registerLimiter, validate(registerSchema), auth.register);
router.post('/login', loginLimiter, validate(loginSchema), auth.login);
router.post('/logout', auth.logout);
router.post('/logout-all', requireAuth, auth.logoutAll);
router.get('/me', requireAuth, auth.me);

// Sign in with Google / GitHub (the fixed paths first, then /:provider)
router.get('/providers', oauth.providers);
router.get('/oauth/pending', oauth.pending);
router.post('/oauth/complete', oauthSignupLimiter, validate(completeOAuthSchema), oauth.complete);
router.get('/:provider', loginLimiter, oauth.start);
router.get('/:provider/callback', loginLimiter, oauth.callback);

export default router;
