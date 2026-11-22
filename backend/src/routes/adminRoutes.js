import { Router } from 'express';
import { getStats, listAllBookings, listProvidersForAdmin, listUsers, setProviderApproval, setUserStatus } from '../controllers/adminController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { adminBookingListRules, adminUserListRules, approvalRules, userStatusRules } from '../validators/adminValidators.js';
import { idParam } from '../validators/common.js';

const router = Router();
router.use(authenticate, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', adminUserListRules, validate, listUsers);
router.patch('/users/:id/status', idParam, userStatusRules, validate, setUserStatus);
router.get('/providers', listProvidersForAdmin);
router.patch('/providers/:id/approval', idParam, approvalRules, validate, setProviderApproval);
router.get('/bookings', adminBookingListRules, validate, listAllBookings);

export default router;
