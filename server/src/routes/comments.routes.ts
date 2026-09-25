import { Router } from 'express';
import * as comments from '../controllers/comments.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { editCommentSchema } from '../validators/blog.schemas.js';

// /api/comments/:id — listing and posting live under /api/posts/:id/comments
const router = Router();
router.use(requireAuth);

router.patch('/:id', validate(editCommentSchema), comments.edit);
router.delete('/:id', comments.remove);
router.post('/:id/like', comments.like);
router.delete('/:id/like', comments.unlike);

export default router;
