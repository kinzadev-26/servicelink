import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyToken } from '../utils/token.js';

// Authentication = "who are you?". Reads "Authorization: Bearer <token>", verifies the signature and expiry,
// then loads the user so a suspended account or a changed role takes effect immediately.
export const authenticate = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) throw new AppError('Please log in to continue', 401);

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Your session has expired. Please log in again.' : 'Invalid token. Please log in again.';
    throw new AppError(message, 401);
  }

  const user = await User.findById(payload.id).select('name role isActive');
  if (!user) throw new AppError('This account no longer exists', 401);
  if (!user.isActive) throw new AppError('Your account is suspended', 403);

  req.user = { id: user._id.toString(), objectId: user._id, name: user.name, role: user.role };
  next();
});
