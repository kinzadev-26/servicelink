import { AppError } from '../utils/AppError.js';

// Authorization = "what may you do?". Use after authenticate: authorize('provider'), authorize('customer', 'provider').
export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to do this', 403));
  }
  next();
};
