import { Router } from 'express';
import { createCategory, deleteCategory, listCategories, updateCategory } from '../controllers/categoryController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { categoryRules } from '../validators/categoryValidators.js';
import { idParam } from '../validators/common.js';

const router = Router();

router.get('/', listCategories);
router.post('/', authenticate, authorize('admin'), categoryRules, validate, createCategory);
router.put('/:id', authenticate, authorize('admin'), idParam, categoryRules, validate, updateCategory);
router.delete('/:id', authenticate, authorize('admin'), idParam, validate, deleteCategory);

export default router;
