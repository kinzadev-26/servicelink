import { body } from 'express-validator';

export const updateProviderRules = [
  body('bio').optional().trim().isLength({ max: 500 }).withMessage('Bio is at most 500 characters'),
  body('city').optional().trim().notEmpty().withMessage('City cannot be empty'),
  body('experienceYears').optional().isInt({ min: 0, max: 60 }).withMessage('Experience must be 0 to 60 years').toInt(),
  body('categories').optional().isArray({ max: 10 }).withMessage('categories must be a list'),
  body('categories.*').isMongoId().withMessage('Pick valid categories'),
  body('photoUrl').optional({ values: 'falsy' }).isURL().withMessage('Photo must be a valid URL'),
  body('paymentAccounts').optional().isObject().withMessage('paymentAccounts must be an object'),
  body('paymentAccounts.easypaisa').optional({ values: 'falsy' }).trim().isLength({ max: 40 }).withMessage('Easypaisa number is too long'),
  body('paymentAccounts.jazzcash').optional({ values: 'falsy' }).trim().isLength({ max: 40 }).withMessage('JazzCash number is too long'),
  body('paymentAccounts.bank').optional({ values: 'falsy' }).trim().isLength({ max: 120 }).withMessage('Bank details are too long'),
  body('isPaused').optional().isBoolean().withMessage('isPaused must be true or false').toBoolean(),
];
