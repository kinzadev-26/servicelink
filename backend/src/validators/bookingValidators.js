import { body, query } from 'express-validator';
import { DATE_RE, TIME_RE, isValidDate } from '../utils/time.js';

const dateRule = (chain) => chain.matches(DATE_RE).withMessage('Date must look like 2026-11-20').bail().custom(isValidDate).withMessage('That date does not exist');
const STATUSES = ['pending', 'confirmed', 'rejected', 'completed', 'cancelled'];

export const createBookingRules = [
  body('service').isMongoId().withMessage('Pick a valid service'),
  dateRule(body('date')),
  body('startTime').matches(TIME_RE).withMessage('Start time must look like 10:00'),
  body('address').optional({ values: 'falsy' }).trim().isLength({ max: 200 }).withMessage('Address is at most 200 characters'),
  body('notes').optional({ values: 'falsy' }).trim().isLength({ max: 300 }).withMessage('Notes are at most 300 characters'),
  body('paymentMethod').optional().isIn(['cash', 'transfer']).withMessage('Payment method must be cash or transfer'),
  // optional first message to the provider, sent together with the request
  body('message').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }).withMessage('Message is at most 1000 characters'),
];

export const statusRules = [
  body('status').isIn(['confirmed', 'rejected', 'completed', 'cancelled']).withMessage('Status must be confirmed, rejected, completed or cancelled'),
  body('reason').optional({ values: 'falsy' }).trim().isLength({ max: 200 }).withMessage('Reason is at most 200 characters'),
];

export const bookingListRules = [
  query('status').optional().isIn(STATUSES).withMessage('Unknown status'),
  query('from').optional().matches(DATE_RE).withMessage('from must look like 2026-11-20'),
  query('to').optional().matches(DATE_RE).withMessage('to must look like 2026-11-20'),
];

export const slotRules = [dateRule(query('date'))];

export const reviewRules = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be a whole number from 1 to 5').toInt(),
  body('comment').optional({ values: 'falsy' }).trim().isLength({ max: 500 }).withMessage('Comment is at most 500 characters'),
];

export const paymentRules = [
  body('action').isIn(['submit', 'confirm', 'reject']).withMessage('Action must be submit, confirm or reject'),
  body('reference')
    .if(body('action').equals('submit'))
    .trim().isLength({ min: 4, max: 60 }).withMessage('Enter the transaction id (4 to 60 characters)'),
  body('reason').optional({ values: 'falsy' }).trim().isLength({ max: 200 }).withMessage('Reason is at most 200 characters'),
];
