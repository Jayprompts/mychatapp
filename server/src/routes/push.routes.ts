import { Router } from 'express';
import * as push from '../controllers/push.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { pushSubscriptionSchema, pushUnsubscribeSchema } from '../validators/push.schemas.js';

const router = Router();

router.get('/key', push.publicKey);
router.post('/subscriptions', requireAuth, validate(pushSubscriptionSchema), push.subscribe);
router.delete('/subscriptions', requireAuth, validate(pushUnsubscribeSchema), push.unsubscribe);

export default router;
