import { Router } from 'express';
import { createService, deleteService, getService, listMyServices, listServices, updateService } from '../controllers/serviceController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { loadProvider } from '../middleware/loadProvider.js';
import { validate } from '../middleware/validate.js';
import { idParam } from '../validators/common.js';
import { createServiceRules, updateServiceRules } from '../validators/serviceValidators.js';

const router = Router();
const providerOnly = [authenticate, authorize('provider'), loadProvider];

router.get('/', listServices);
router.get('/mine', ...providerOnly, listMyServices); // before "/:id"
router.get('/:id', idParam, validate, getService);
router.post('/', ...providerOnly, createServiceRules, validate, createService);
router.put('/:id', ...providerOnly, idParam, updateServiceRules, validate, updateService);
router.delete('/:id', ...providerOnly, idParam, validate, deleteService);

export default router;
