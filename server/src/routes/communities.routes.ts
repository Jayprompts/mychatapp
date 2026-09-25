import { Router } from 'express';
import multer from 'multer';
import * as communities from '../controllers/communities.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { MEDIA_LIMITS } from '../services/media.js';
import { createCommunitySchema, updateCommunitySchema } from '../validators/chat.schemas.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MEDIA_LIMITS.uploadBytes, files: 1 } });
const router = Router();

router.use(requireAuth);

router.get('/discover', communities.discover);
router.get('/mine', communities.mine);
router.post('/', validate(createCommunitySchema), communities.create);
router.get('/invite/:code', communities.invitePreview);
router.post('/invite/:code/join', communities.joinByInvite);
router.get('/:id', communities.get);
router.patch('/:id', validate(updateCommunitySchema), communities.update);
router.delete('/:id', communities.remove);
router.post('/:id/cover', upload.single('file'), communities.uploadCover);
router.get('/:id/cover', communities.getCover);
router.post('/:id/join', communities.join);
router.delete('/:id/join', communities.cancelRequest);
router.post('/:id/requests/:userId/approve', communities.answerRequest(true));
router.post('/:id/requests/:userId/reject', communities.answerRequest(false));
router.post('/:id/invite/reset', communities.resetInvite);

export default router;
