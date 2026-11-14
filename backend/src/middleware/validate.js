import { validationResult } from 'express-validator';
import { AppError } from '../utils/AppError.js';

// Put this after a list of express-validator rules.
export function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
  next(new AppError('Validation failed', 400, errors));
}
