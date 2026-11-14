import Booking, { ACTIVE_STATUSES } from '../models/Booking.js';
import Category from '../models/Category.js';
import Provider from '../models/Provider.js';
import Service from '../models/Service.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/respond.js';
import { buildMeta, parsePagination, textRegex } from '../utils/query.js';

const SORTS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1, _id: 1 },
  price_desc: { price: -1, _id: 1 },
};

const populateService = (query) =>
  query
    .populate('category', 'name slug')
    .populate({ path: 'provider', select: 'city avgRating reviewCount user', populate: { path: 'user', select: 'name' } });

// GET /api/services?search=&category=&city=&minPrice=&maxPrice=&minRating=&sort=&page=&limit=
export const listServices = asyncHandler(async (req, res) => {
  const { search, category, city, minPrice, maxPrice, minRating, sort = 'newest' } = req.query;
  const paging = parsePagination(req.query);

  // Step 1: which providers may appear? (approved, unpaused, matching city and rating)
  const providerFilter = { approvalStatus: 'approved', isPaused: false };
  if (city) providerFilter.city = textRegex(city, true);
  if (minRating) providerFilter.avgRating = { $gte: Number(minRating) };
  const providerIds = await Provider.find(providerFilter).distinct('_id');

  // Step 2: services of those providers that match the remaining filters
  const filter = { isActive: true, provider: { $in: providerIds } };
  if (category) filter.category = category;
  if (search) {
    const regex = textRegex(search);
    filter.$or = [{ title: regex }, { description: regex }];
  }
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const [services, total] = await Promise.all([
    populateService(Service.find(filter).sort(SORTS[sort] || SORTS.newest).skip(paging.skip).limit(paging.limit)),
    Service.countDocuments(filter),
  ]);

  sendSuccess(res, services, { meta: buildMeta(paging, total) });
});

// GET /api/services/:id
export const getService = asyncHandler(async (req, res) => {
  const service = await populateService(Service.findById(req.params.id));
  if (!service) throw new AppError('Service not found', 404);
  sendSuccess(res, service);
});

// POST /api/services  (Week 2: provider id in body; Week 3: from the JWT)
export const createService = asyncHandler(async (req, res) => {
  const { provider, category, title, description, price, durationMinutes } = req.body;

  const providerDoc = await Provider.findById(provider);
  if (!providerDoc) throw new AppError('Provider not found', 404);
  if (providerDoc.approvalStatus !== 'approved') throw new AppError('Provider is not approved yet', 403);
  if (!(await Category.exists({ _id: category }))) throw new AppError('Category not found', 404);

  const service = await Service.create({ provider, category, title, description, price, durationMinutes });
  sendSuccess(res, await populateService(Service.findById(service._id)), { status: 201, message: 'Service created' });
});

// PUT /api/services/:id  (only these fields can change)
export const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw new AppError('Service not found', 404);

  for (const field of ['category', 'title', 'description', 'price', 'durationMinutes', 'isActive']) {
    if (req.body[field] !== undefined) service[field] = req.body[field];
  }
  if (req.body.category && !(await Category.exists({ _id: req.body.category }))) {
    throw new AppError('Category not found', 404);
  }
  await service.save();
  sendSuccess(res, await populateService(Service.findById(service._id)), { message: 'Service updated' });
});

// DELETE /api/services/:id  (SRV-2: not while active bookings exist)
export const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw new AppError('Service not found', 404);

  const hasBookings = await Booking.exists({ service: service._id, status: { $in: ACTIVE_STATUSES } });
  if (hasBookings) {
    throw new AppError('This service has pending or confirmed bookings. Deactivate it instead.', 409);
  }
  await service.deleteOne();
  sendSuccess(res, null, { message: 'Service deleted' });
});
