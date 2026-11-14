import Category from '../models/Category.js';
import Service from '../models/Service.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/respond.js';

// GET /api/categories
export const listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  sendSuccess(res, categories);
});

// POST /api/categories  (admin only from Week 3)
export const createCategory = asyncHandler(async (req, res) => {
  const { name, icon } = req.body;
  const category = await Category.create({ name, icon });
  sendSuccess(res, category, { status: 201, message: 'Category created' });
});

// PUT /api/categories/:id
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found', 404);
  if (req.body.name !== undefined) category.name = req.body.name;
  if (req.body.icon !== undefined) category.icon = req.body.icon;
  await category.save(); // save() so the slug hook runs
  sendSuccess(res, category, { message: 'Category updated' });
});

// DELETE /api/categories/:id  (SRV-4: a category in use cannot be deleted)
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found', 404);
  const inUse = await Service.exists({ category: category._id });
  if (inUse) throw new AppError('This category has services and cannot be deleted', 409);
  await category.deleteOne();
  sendSuccess(res, null, { message: 'Category deleted' });
});
