import { body } from 'express-validator';

export const registerRules = [
  body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2 to 60 characters'),
  body('email').trim().toLowerCase().isEmail().withMessage('Enter a valid email address'),
  body('password')
    .isLength({ min: 8, max: 72 }).withMessage('Password must be 8 to 72 characters')
    .matches(/[A-Za-z]/).withMessage('Password needs at least one letter')
    .matches(/\d/).withMessage('Password needs at least one number'),
  // AUTH-10: nobody can register as admin
  body('role').optional().isIn(['customer', 'provider']).withMessage('Role must be customer or provider'),
  body('phone').optional({ values: 'falsy' }).trim().isLength({ max: 20 }).withMessage('Phone number is too long'),
  body('city').if(body('role').equals('provider')).trim().notEmpty().withMessage('City is required for providers'),
];

export const loginRules = [
  body('email').trim().toLowerCase().isEmail().withMessage('Enter a valid email address'),
  body('password').notEmpty().withMessage('Password is required'),
];
