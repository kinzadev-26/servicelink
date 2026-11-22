import { Router } from 'express';
import { deleteReview } from '../controllers/reviewController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { idParam } from '../validators/common.js';

const router = Router();
router.delete('/:id', authenticate, authorize('admin'), idParam, validate, deleteReview);
export default router;
