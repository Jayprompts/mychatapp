import { Router } from 'express';
import * as admin from '../controllers/admin.controller.js';
import * as mod from '../controllers/moderation.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  bulkPostsSchema,
  bulkUsersSchema,
  communityFlagsSchema,
  memberRoleSchema,
  postFlagsSchema,
  resolveReportSchema,
  setRoleSchema,
  setStatusSchema,
  withReasonSchema,
} from '../validators/admin.schemas.js';

// Every route here checks the role on the server — hiding a button is never the only protection.
// (requireRole: Super Admins always pass.)
const router = Router();
router.use(requireAuth);

const anyStaff = requireRole('content_mod', 'community_mgr');
const superAdmin = requireRole(); // Super Admin only
const moderators = requireRole('content_mod'); // reports + blog
const communityManagers = requireRole('community_mgr'); // communities

router.get('/stats', anyStaff, admin.stats);
router.get('/users', anyStaff, admin.listUsers);
router.get('/staff', anyStaff, admin.staff);
router.patch('/users/:id/status', superAdmin, validate(setStatusSchema), admin.setStatus);
router.patch('/users/:id/role', superAdmin, validate(setRoleSchema), admin.setRole);
router.delete('/users/:id', superAdmin, admin.removeUser);
router.post('/users/bulk', superAdmin, validate(bulkUsersSchema), admin.bulkUsers);
router.get('/audit', superAdmin, admin.auditLog);

// Reports queue
router.get('/reports/count', anyStaff, mod.reportCount);
router.get('/reports', moderators, mod.listReports);
router.get('/reports/:type/:id', moderators, mod.reportDetail);
router.post('/reports/:type/:id/resolve', moderators, validate(resolveReportSchema), mod.resolveReport);

// Blog management
router.get('/posts', moderators, mod.listPosts);
router.post('/posts/bulk', moderators, validate(bulkPostsSchema), mod.bulkPosts);
router.patch('/posts/:id', moderators, validate(postFlagsSchema), mod.setPostFlags);
router.post('/posts/:id/unpublish', moderators, validate(withReasonSchema), mod.unpublishPost);
router.delete('/posts/:id', moderators, validate(withReasonSchema), mod.deletePost);

// Community management
router.get('/communities', communityManagers, mod.listCommunities);
router.patch('/communities/:id', communityManagers, validate(communityFlagsSchema), mod.setCommunityFlags);
router.delete('/communities/:id', communityManagers, validate(withReasonSchema), mod.deleteCommunity);
router.get('/communities/:id/members', communityManagers, mod.communityMembers);
router.patch('/communities/:id/members/:userId', communityManagers, validate(memberRoleSchema), mod.setMemberRole);
router.delete('/communities/:id/members/:userId', communityManagers, mod.removeMember);

export default router;
