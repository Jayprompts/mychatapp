import { Router } from 'express';
import multer from 'multer';
import * as posts from '../controllers/posts.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { postWriteLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { MEDIA_LIMITS } from '../services/media.js';
import { createPostSchema, updatePostSchema } from '../validators/blog.schemas.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MEDIA_LIMITS.uploadBytes, files: 1 } });
const router = Router();

router.use(requireAuth);

router.get('/', posts.feed);
router.get('/saved', posts.saved);
router.get('/mine', posts.mine);
router.post('/', postWriteLimiter, validate(createPostSchema), posts.create);
router.get('/:id', posts.get);
router.patch('/:id', validate(updatePostSchema), posts.update);
router.delete('/:id', posts.remove);
router.post('/:id/cover', upload.single('file'), posts.uploadCover);
router.get('/:id/cover', posts.getCover);
router.post('/:id/images', upload.single('file'), posts.addImage);
router.get('/:id/images/:imageId', posts.getImage);
router.delete('/:id/images/:imageId', posts.removeImage);
router.post('/:id/like', posts.like);
router.delete('/:id/like', posts.unlike);
router.post('/:id/bookmark', posts.bookmark);
router.delete('/:id/bookmark', posts.unbookmark);

export default router;
