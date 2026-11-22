import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import Provider from '../models/Provider.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/respond.js';
import { signToken } from '../utils/token.js';
import { notifyAdmins } from '../services/notificationService.js';

// What the frontend may see about a user. The password hash is never included.
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, phone: u.phone, city: u.city });

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, city } = req.body;
  const role = req.body.role || 'customer';

  if (await User.exists({ email })) throw new AppError('An account with this email already exists', 409);

  const passwordHash = await bcrypt.hash(password, env.saltRounds);
  const user = await User.create({ name, email, passwordHash, role, phone, city });

  let provider = null;
  if (role === 'provider') {
    try {
      provider = await Provider.create({ user: user._id, city }); // starts as "pending" until an admin approves
    } catch (err) {
      await user.deleteOne(); // do not leave a provider user without a provider profile
      throw err;
    }
  }

  if (provider) notifyAdmins({ type: 'provider', title: 'New provider waiting for approval', body: `${name} (${city}) registered as a provider`, link: '/admin' });

  sendSuccess(
    res,
    { token: signToken(user), user: publicUser(user), approvalStatus: provider?.approvalStatus },
    { status: 201, message: role === 'provider' ? 'Account created. An admin must approve your profile before you appear in search.' : 'Account created' }
  );
});

// POST /api/auth/login  (same message for "no such user" and "wrong password" so emails cannot be probed)
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) throw new AppError('Invalid email or password', 401);
  if (!user.isActive) throw new AppError('Your account is suspended', 403);

  sendSuccess(res, { token: signToken(user), user: publicUser(user) }, { message: 'Logged in' });
});

// GET /api/auth/me
export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new AppError('This account no longer exists', 401);
  const data = { user: publicUser(user) };
  if (user.role === 'provider') {
    const p = await Provider.findOne({ user: user._id }).select('approvalStatus rejectionReason isPaused');
    data.provider = p;
  }
  sendSuccess(res, data);
});
