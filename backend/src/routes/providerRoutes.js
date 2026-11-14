import { Router } from 'express';
import { getProvider, listProviders } from '../controllers/providerController.js';
import { validate } from '../middleware/validate.js';
import { idParam } from '../validators/common.js';

const router = Router();

router.get('/', listProviders);
router.get('/:id', idParam, validate, getProvider);

export default router;
