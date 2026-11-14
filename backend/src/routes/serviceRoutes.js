import { Router } from 'express';
import { createService, deleteService, getService, listServices, updateService } from '../controllers/serviceController.js';
import { validate } from '../middleware/validate.js';
import { idParam } from '../validators/common.js';
import { createServiceRules, updateServiceRules } from '../validators/serviceValidators.js';

const router = Router();

router.get('/', listServices);
router.get('/:id', idParam, validate, getService);
// TODO Week 3: add authenticate, authorize('provider') and an ownership check to these three
router.post('/', createServiceRules, validate, createService);
router.put('/:id', idParam, updateServiceRules, validate, updateService);
router.delete('/:id', idParam, validate, deleteService);

export default router;
