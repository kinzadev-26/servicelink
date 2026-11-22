import Availability from '../models/Availability.js';
import Booking, { ACTIVE_STATUSES } from '../models/Booking.js';
import Category from '../models/Category.js';
import Provider from '../models/Provider.js';
import Review from '../models/Review.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/respond.js';
import { buildMeta, parsePagination, textRegex } from '../utils/query.js';
import { getFreeSlots } from '../services/slotService.js';

// GET /api/providers?search=&city=&category=&minRating=&page=&limit=
export const listProviders = asyncHandler(async (req, res) => {
  const { search, city, category, minRating } = req.query;
  const paging = parsePagination(req.query);

  // SRC-5: only approved, unpaused providers are ever listed
  const filter = { approvalStatus: 'approved', isPaused: false };
  if (city) filter.city = textRegex(city, true);
  if (category) filter.categories = category;
  if (minRating) filter.avgRating = { $gte: Number(minRating) };
  if (search) {
    // The provider's name lives on the User document, so find matching users first.
    const userIds = await User.find({ name: textRegex(search), role: 'provider' }).distinct('_id');
    filter.user = { $in: userIds };
  }

  const [providers, total] = await Promise.all([
    Provider.find(filter)
      .populate('user', 'name')
      .populate('categories', 'name slug')
      .sort({ avgRating: -1, reviewCount: -1 })
      .skip(paging.skip)
      .limit(paging.limit),
    Provider.countDocuments(filter),
  ]);

  sendSuccess(res, providers, { meta: buildMeta(paging, total) });
});

// GET /api/providers/:id  (provider profile plus its active services)
export const getProvider = asyncHandler(async (req, res) => {
  const provider = await Provider.findById(req.params.id)
    .populate('user', 'name')
    .populate('categories', 'name slug');
  if (!provider || provider.approvalStatus !== 'approved') throw new AppError('Provider not found', 404);

  const services = await Service.find({ provider: provider._id, isActive: true })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 });

  sendSuccess(res, { provider, services });
});

// GET /api/providers/me  (the logged-in provider's own profile, whatever its approval status)
export const getMyProvider = asyncHandler(async (req, res) => {
  const provider = await req.provider.populate('categories', 'name slug');
  sendSuccess(res, provider);
});

// PUT /api/providers/me  (only these fields; approval status can never be changed here)
export const updateMyProvider = asyncHandler(async (req, res) => {
  for (const field of ['bio', 'city', 'experienceYears', 'categories', 'photoUrl', 'isPaused']) {
    if (req.body[field] !== undefined) req.provider[field] = req.body[field];
  }
  if (req.body.paymentAccounts) {
    for (const key of ['easypaisa', 'jazzcash', 'bank']) {
      if (req.body.paymentAccounts[key] !== undefined) req.provider.paymentAccounts[key] = req.body.paymentAccounts[key];
    }
  }
  if (req.body.categories) {
    const found = await Category.countDocuments({ _id: { $in: req.body.categories } });
    if (found !== req.body.categories.length) throw new AppError('One or more categories do not exist', 404);
  }
  await req.provider.save();
  sendSuccess(res, await req.provider.populate('categories', 'name slug'), { message: 'Profile updated' });
});

// GET /api/providers/:id/slots?date=2026-11-20  (free slots, computed on the server)
export const getSlots = asyncHandler(async (req, res) => {
  const provider = await Provider.findById(req.params.id);
  if (!provider || provider.approvalStatus !== 'approved' || provider.isPaused) throw new AppError('Provider not found', 404);

  const { date } = req.query;
  const [availability, bookings] = await Promise.all([
    Availability.findOne({ provider: provider._id }).lean(),
    Booking.find({ provider: provider._id, date, status: { $in: ACTIVE_STATUSES } }).select('startTime endTime').lean(),
  ]);
  sendSuccess(res, { date, slots: getFreeSlots({ date, availability, bookings }) });
});

// GET /api/providers/:id/reviews
export const listProviderReviews = asyncHandler(async (req, res) => {
  const paging = parsePagination(req.query);
  const filter = { provider: req.params.id };
  const [reviews, total] = await Promise.all([
    Review.find(filter).populate('customer', 'name').sort({ createdAt: -1 }).skip(paging.skip).limit(paging.limit),
    Review.countDocuments(filter),
  ]);
  sendSuccess(res, reviews, { meta: buildMeta(paging, total) });
});
