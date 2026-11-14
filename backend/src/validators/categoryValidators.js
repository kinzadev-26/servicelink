import { body } from 'express-validator';

export const categoryRules = [
  body('name').trim().isLength({ min: 2, max: 40 }).withMessage('Name must be 2 to 40 characters'),
  body('icon').optional().trim().isLength({ max: 40 }),
];
