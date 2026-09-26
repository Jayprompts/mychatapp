import { Router } from 'express';
import * as admin from '../controllers/admin.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { bulkUsersSchema, setRoleSchema, setStatusSchema } from '../validators/admin.schemas.js';

// Every route here checks the role on the server — hiding a button is never the only protection.
// (requireRole: Super Admins always pass.)
const router = Router();
router.use(requireAuth);

const anyStaff = requireRole('content_mod', 'community_mgr');
const superAdmin = requireRole(); // Super Admin only

router.get('/stats', anyStaff, admin.stats);
router.get('/users', anyStaff, admin.listUsers);
router.get('/staff', anyStaff, admin.staff);
router.patch('/users/:id/status', superAdmin, validate(setStatusSchema), admin.setStatus);
router.patch('/users/:id/role', superAdmin, validate(setRoleSchema), admin.setRole);
router.delete('/users/:id', superAdmin, admin.removeUser);
router.post('/users/bulk', superAdmin, validate(bulkUsersSchema), admin.bulkUsers);
router.get('/audit', superAdmin, admin.auditLog);

export default router;
