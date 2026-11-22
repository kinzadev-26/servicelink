import { Router } from 'express';
import { listNotifications, markAllRead, markOneRead } from '../controllers/notificationController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { idParam } from '../validators/common.js';

const router = Router();
router.use(authenticate);
router.get('/', listNotifications);
router.patch('/read-all', markAllRead); // before "/:id/read"
router.patch('/:id/read', idParam, validate, markOneRead);
export default router;
