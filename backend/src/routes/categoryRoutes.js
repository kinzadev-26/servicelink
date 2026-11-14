import { Router } from 'express';
import { createCategory, deleteCategory, listCategories, updateCategory } from '../controllers/categoryController.js';
import { validate } from '../middleware/validate.js';
import { categoryRules } from '../validators/categoryValidators.js';
import { idParam } from '../validators/common.js';

const router = Router();

router.get('/', listCategories);
// TODO Week 3: add authenticate and authorize('admin') before these three
router.post('/', categoryRules, validate, createCategory);
router.put('/:id', idParam, categoryRules, validate, updateCategory);
router.delete('/:id', idParam, validate, deleteCategory);

export default router;
