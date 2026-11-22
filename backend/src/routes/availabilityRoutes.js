import { Router } from 'express';
import { getMyAvailability, saveMyAvailability } from '../controllers/availabilityController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { loadProvider } from '../middleware/loadProvider.js';
import { validate } from '../middleware/validate.js';
import { availabilityRules } from '../validators/availabilityValidators.js';

const router = Router();
router.use(authenticate, authorize('provider'), loadProvider);
router.get('/me', getMyAvailability);
router.put('/me', availabilityRules, validate, saveMyAvailability);
export default router;
