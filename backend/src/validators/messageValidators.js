import { body, query } from 'express-validator';

export const startConversationRules = [
  body('provider').optional().isMongoId().withMessage('Pick a valid provider'),
  body('customer').optional().isMongoId().withMessage('Pick a valid customer'),
  body().custom((b) => { if (!b.provider && !b.customer) throw new Error('provider or customer is required'); return true; }),
];

export const sendMessageRules = [
  body('text').trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be 1 to 1000 characters'),
];

export const messageListRules = [
  query('before').optional().isISO8601().withMessage('before must be a date'),
];
