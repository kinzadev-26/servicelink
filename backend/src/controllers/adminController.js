import Booking from '../models/Booking.js';
import Provider from '../models/Provider.js';
import Review from '../models/Review.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import { notify } from '../services/notificationService.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildMeta, parsePagination } from '../utils/query.js';
import { sendSuccess } from '../utils/respond.js';

// GET /api/admin/stats
export const getStats = asyncHandler(async (req, res) => {
  const [users, providers, pendingProviders, services, bookings, reviews, byStatus, paid] = await Promise.all([
    User.countDocuments(),
    Provider.countDocuments({ approvalStatus: 'approved' }),
    Provider.countDocuments({ approvalStatus: 'pending' }),
    Service.countDocuments({ isActive: true }),
    Booking.countDocuments(),
    Review.countDocuments(),
    Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Booking.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$priceAtBooking' } } }]),
  ]);
  const bookingsByStatus = Object.fromEntries(byStatus.map((r) => [r._id, r.count]));
  sendSuccess(res, { users, providers, pendingProviders, services, bookings, reviews, bookingsByStatus, paidTotal: paid[0]?.total || 0 });
});

// GET /api/admin/users?role=
export const listUsers = asyncHandler(async (req, res) => {
  const paging = parsePagination(req.query);
  const filter = req.query.role ? { role: req.query.role } : {};
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(paging.skip).limit(paging.limit),
    User.countDocuments(filter),
  ]);
  sendSuccess(res, users, { meta: buildMeta(paging, total) });
});

// PATCH /api/admin/users/:id/status  (suspend or restore)
export const setUserStatus = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) throw new AppError('You cannot suspend your own account', 400);
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  if (user.role === 'admin') throw new AppError('Admin accounts cannot be suspended here', 403);
  user.isActive = req.body.isActive;
  await user.save();
  sendSuccess(res, user, { message: user.isActive ? 'User restored' : 'User suspended' });
});

// GET /api/admin/providers?approvalStatus=pending
export const listProvidersForAdmin = asyncHandler(async (req, res) => {
  const paging = parsePagination(req.query);
  const filter = req.query.approvalStatus ? { approvalStatus: req.query.approvalStatus } : {};
  const [providers, total] = await Promise.all([
    Provider.find(filter).populate('user', 'name email phone').populate('categories', 'name').sort({ createdAt: -1 }).skip(paging.skip).limit(paging.limit),
    Provider.countDocuments(filter),
  ]);
  sendSuccess(res, providers, { meta: buildMeta(paging, total) });
});

// PATCH /api/admin/providers/:id/approval
export const setProviderApproval = asyncHandler(async (req, res) => {
  const provider = await Provider.findById(req.params.id);
  if (!provider) throw new AppError('Provider not found', 404);
  provider.approvalStatus = req.body.approvalStatus;
  provider.rejectionReason = req.body.approvalStatus === 'rejected' ? req.body.rejectionReason || '' : '';
  await provider.save();
  notify(provider.user, { type: 'provider', title: `Your profile was ${provider.approvalStatus}`, body: provider.approvalStatus === 'approved' ? 'You now appear in search and can add services.' : provider.rejectionReason, link: '/dashboard' });
  sendSuccess(res, provider, { message: `Provider ${provider.approvalStatus}` });
});

// GET /api/admin/bookings?status=&provider=&from=&to=
export const listAllBookings = asyncHandler(async (req, res) => {
  const { status, provider, from, to } = req.query;
  const paging = parsePagination(req.query);
  const filter = {};
  if (status) filter.status = status;
  if (provider) filter.provider = provider;
  if (from || to) filter.date = { ...(from && { $gte: from }), ...(to && { $lte: to }) };

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('service', 'title')
      .populate('customer', 'name')
      .populate({ path: 'provider', select: 'user', populate: { path: 'user', select: 'name' } })
      .sort({ date: -1, startTime: -1 })
      .skip(paging.skip)
      .limit(paging.limit),
    Booking.countDocuments(filter),
  ]);
  sendSuccess(res, bookings, { meta: buildMeta(paging, total) });
});
