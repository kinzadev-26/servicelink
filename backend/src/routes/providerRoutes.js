import { Router } from 'express';
import { getMyProvider, getProvider, getSlots, listProviderReviews, listProviders, updateMyProvider } from '../controllers/providerController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { loadProvider } from '../middleware/loadProvider.js';
import { validate } from '../middleware/validate.js';
import { slotRules } from '../validators/bookingValidators.js';
import { idParam } from '../validators/common.js';
import { updateProviderRules } from '../validators/providerValidators.js';

const router = Router();

router.get('/', listProviders);
// "/me" must come before "/:id", otherwise Express would treat "me" as an id
router.get('/me', authenticate, authorize('provider'), loadProvider, getMyProvider);
router.put('/me', authenticate, authorize('provider'), updateProviderRules, validate, loadProvider, updateMyProvider);
router.get('/:id', idParam, validate, getProvider);
router.get('/:id/slots', idParam, slotRules, validate, getSlots);
router.get('/:id/reviews', idParam, validate, listProviderReviews);

export default router;
