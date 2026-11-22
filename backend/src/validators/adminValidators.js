import { body, query } from 'express-validator';
import { DATE_RE } from '../utils/time.js';

export const userStatusRules = [body('isActive').isBoolean().withMessage('isActive must be true or false').toBoolean()];

export const approvalRules = [
  body('approvalStatus').isIn(['approved', 'rejected']).withMessage('approvalStatus must be approved or rejected'),
  body('rejectionReason').optional({ values: 'falsy' }).trim().isLength({ max: 200 }).withMessage('Reason is at most 200 characters'),
];

export const adminUserListRules = [query('role').optional().isIn(['customer', 'provider', 'admin']).withMessage('Unknown role')];

export const adminBookingListRules = [
  query('status').optional().isIn(['pending', 'confirmed', 'rejected', 'completed', 'cancelled']).withMessage('Unknown status'),
  query('provider').optional().isMongoId().withMessage('provider must be a valid id'),
  query('from').optional().matches(DATE_RE).withMessage('from must look like 2026-11-20'),
  query('to').optional().matches(DATE_RE).withMessage('to must look like 2026-11-20'),
];
