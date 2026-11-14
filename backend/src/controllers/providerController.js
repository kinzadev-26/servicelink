import Provider from '../models/Provider.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/respond.js';
import { buildMeta, parsePagination, textRegex } from '../utils/query.js';

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
