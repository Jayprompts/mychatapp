import { Router } from 'express';
import * as reports from '../controllers/reports.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { reportLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { createReportSchema } from '../validators/report.schemas.js';

const router = Router();
router.use(requireAuth);

router.post('/', reportLimiter, validate(createReportSchema), reports.create);

export default router;
