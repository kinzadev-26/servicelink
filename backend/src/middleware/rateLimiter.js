import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

// NFR-5: slows down password guessing. Only failed attempts count, so normal users are not affected.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.authRateLimitMax,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => env.nodeEnv === 'test',
  handler: (req, res, next) => next(new AppError('Too many attempts. Please try again in 15 minutes.', 429)),
});
