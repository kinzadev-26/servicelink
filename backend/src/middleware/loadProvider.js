import Provider from '../models/Provider.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// For provider-only routes: attaches the caller's own Provider document as req.provider.
// Controllers then use req.provider._id, never an id sent in the request body.
export const loadProvider = asyncHandler(async (req, res, next) => {
  const provider = await Provider.findOne({ user: req.user.id });
  if (!provider) throw new AppError('Provider profile not found', 404);
  req.provider = provider;
  next();
});
