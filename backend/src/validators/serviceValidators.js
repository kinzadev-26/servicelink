import { body } from 'express-validator';

const shared = (required) => {
  const opt = (chain) => (required ? chain : chain.optional());
  return [
    opt(body('category')).isMongoId().withMessage('Pick a valid category'),
    opt(body('title')).trim().isLength({ min: 3, max: 80 }).withMessage('Title must be 3 to 80 characters'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description is at most 500 characters'),
    opt(body('price')).isInt({ min: 1 }).withMessage('Price must be a whole number of 1 or more').toInt(),
    body('durationMinutes').optional().isInt({ min: 15, max: 480 }).withMessage('Duration must be 15 to 480 minutes').toInt(),
    body('isActive').optional().isBoolean().toBoolean(),
  ];
};

// Week 2 shortcut: the provider id comes from the body. Week 3 replaces it with req.user.
export const createServiceRules = [
  body('provider').isMongoId().withMessage('Pick a valid provider'),
  ...shared(true),
];

export const updateServiceRules = shared(false);
