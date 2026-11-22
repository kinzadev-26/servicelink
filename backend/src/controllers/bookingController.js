import Availability from '../models/Availability.js';
import Booking, { ACTIVE_STATUSES } from '../models/Booking.js';
import Provider from '../models/Provider.js';
import Review from '../models/Review.js';
import Service from '../models/Service.js';
import { checkPaymentMove } from '../services/paymentService.js';
import { getOrCreateConversation, postMessage } from '../services/chatService.js';
import { checkStatusMove } from '../services/statusService.js';
import { getFreeSlots } from '../services/slotService.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { notify } from '../services/notificationService.js';
import { buildMeta, parsePagination } from '../utils/query.js';
import { sendSuccess } from '../utils/respond.js';

const populateBooking = (q) =>
  q
    .populate('service', 'title price durationMinutes')
    .populate('customer', 'name phone')
    .populate({ path: 'provider', select: 'city user paymentAccounts', populate: { path: 'user', select: 'name phone' } });

// POST /api/bookings  (customer only)
export const createBooking = asyncHandler(async (req, res) => {
  const { service: serviceId, date, startTime, address, notes, message, paymentMethod = 'cash' } = req.body;

  const service = await Service.findById(serviceId);
  if (!service || !service.isActive) throw new AppError('Service not found', 404);
  const provider = await Provider.findById(service.provider);
  if (!provider || provider.approvalStatus !== 'approved' || provider.isPaused) throw new AppError('This provider is not available right now', 404);

  // Recompute the free slots on the server. The client's idea of "free" is never trusted.
  const [availability, active] = await Promise.all([
    Availability.findOne({ provider: provider._id }).lean(),
    Booking.find({ provider: provider._id, date, status: { $in: ACTIVE_STATUSES } }).select('startTime endTime').lean(),
  ]);
  const slot = getFreeSlots({ date, availability, bookings: active }).find((s) => s.startTime === startTime);
  if (!slot) throw new AppError('That time slot is not available. Please pick another one.', 409);

  try {
    const booking = await Booking.create({
      customer: req.user.id,
      provider: provider._id,
      service: service._id,
      date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      address,
      notes,
      priceAtBooking: service.price, // price is copied, so later edits do not change old bookings
      paymentMethod,
    });
    // Optional message to the provider, sent in the same step as the request.
    if (message) {
      try {
        const conv = await getOrCreateConversation(req.user.id, provider.user);
        await postMessage(conv, req.user.id, message);
      } catch (err) {
        console.error('booking message failed:', err.message); // the booking itself already succeeded
      }
    }
    notify(provider.user, { type: 'booking', title: 'New booking request', body: `${req.user.name} requested ${service.title} on ${date} at ${slot.startTime}`, link: '/bookings' });
    sendSuccess(res, await populateBooking(Booking.findById(booking._id)), { status: 201, message: 'Booking request sent' });
  } catch (err) {
    // Two customers clicked at the same moment: the unique index lets only one win (BKG-3).
    if (err.code === 11000) throw new AppError('That time slot was just booked by someone else. Please pick another one.', 409);
    throw err;
  }
});

// GET /api/bookings?status=&from=&to=&page=&limit=  (customers see their own, providers see theirs)
export const listMyBookings = asyncHandler(async (req, res) => {
  const { status, from, to } = req.query;
  const paging = parsePagination(req.query);

  const filter = {};
  if (req.user.role === 'provider') {
    const provider = await Provider.findOne({ user: req.user.id }).select('_id');
    if (!provider) throw new AppError('Provider profile not found', 404);
    filter.provider = provider._id;
  } else {
    filter.customer = req.user.id;
  }
  if (status) filter.status = status;
  if (from || to) filter.date = { ...(from && { $gte: from }), ...(to && { $lte: to }) };

  const [bookings, total] = await Promise.all([
    populateBooking(Booking.find(filter).sort({ date: -1, startTime: -1 }).skip(paging.skip).limit(paging.limit)),
    Booking.countDocuments(filter),
  ]);
  // Tell the frontend which completed bookings already have a review, so it can hide the "Leave a review" button.
  const reviewed = new Set((await Review.find({ booking: { $in: bookings.map((b) => b._id) } }).select('booking').lean()).map((r) => r.booking.toString()));
  const data = bookings.map((b) => ({ ...b.toObject(), reviewed: reviewed.has(b._id.toString()) }));
  sendSuccess(res, data, { meta: buildMeta(paging, total) });
});

// Works out whether the caller is the customer or the provider of this booking, or neither.
async function actorFor(booking, user) {
  if (booking.customer._id ? booking.customer._id.toString() === user.id : booking.customer.toString() === user.id) return 'customer';
  const provider = await Provider.findById(booking.provider._id || booking.provider).select('user');
  if (provider && provider.user.toString() === user.id) return 'provider';
  return null;
}

// GET /api/bookings/:id  (only the two people involved, or an admin)
export const getBooking = asyncHandler(async (req, res) => {
  const booking = await populateBooking(Booking.findById(req.params.id));
  if (!booking) throw new AppError('Booking not found', 404);
  if (req.user.role !== 'admin' && !(await actorFor(booking, req.user))) {
    throw new AppError('You do not have permission to view this booking', 403);
  }
  sendSuccess(res, booking);
});

// PATCH /api/bookings/:id/status
export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status: to, reason } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new AppError('Booking not found', 404);

  const actor = await actorFor(booking, req.user);
  if (!actor) throw new AppError('You do not have permission to change this booking', 403);

  const result = checkStatusMove({ from: booking.status, to, actor, date: booking.date, startTime: booking.startTime });
  if (!result.ok) throw new AppError(result.message, result.status);

  booking.status = to;
  if (['rejected', 'cancelled'].includes(to)) booking.statusReason = reason || '';
  await booking.save();

  // Tell the other person, live.
  const providerDoc = await Provider.findById(booking.provider).select('user');
  const target = actor === 'provider' ? booking.customer : providerDoc.user;
  const word = { confirmed: 'confirmed', rejected: 'rejected', cancelled: 'cancelled', completed: 'marked as completed' }[to];
  notify(target, { type: 'booking', title: `Booking ${to}`, body: `${req.user.name} ${word} the booking on ${booking.date} at ${booking.startTime}`, link: '/bookings' });

  sendSuccess(res, await populateBooking(Booking.findById(booking._id)), { message: `Booking ${to}` });
});

// PATCH /api/bookings/:id/payment   { action: 'submit' | 'confirm' | 'reject', reference?, reason? }
export const updatePayment = asyncHandler(async (req, res) => {
  const { action, reference, reason } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new AppError('Booking not found', 404);

  const actor = await actorFor(booking, req.user);
  if (!actor) throw new AppError('You do not have permission to change this booking', 403);

  const result = checkPaymentMove({ actor, action, method: booking.paymentMethod, from: booking.paymentStatus, bookingStatus: booking.status });
  if (!result.ok) throw new AppError(result.message, result.status);

  booking.paymentStatus = result.to;
  if (action === 'submit') { booking.paymentReference = reference; booking.paymentNote = ''; }
  if (action === 'confirm') booking.paidAt = new Date();
  if (action === 'reject') { booking.paymentReference = ''; booking.paymentNote = reason || ''; }
  await booking.save();

  const providerDoc = await Provider.findById(booking.provider).select('user');
  const text = {
    submit: [providerDoc.user, 'Payment submitted', `${req.user.name} sent PKR ${booking.priceAtBooking} (ref ${reference}). Please check and confirm.`],
    confirm: [booking.customer, 'Payment confirmed', `${req.user.name} confirmed your payment of PKR ${booking.priceAtBooking}.`],
    reject: [booking.customer, 'Payment not verified', `${req.user.name} could not verify your payment.${reason ? ` Reason: ${reason}` : ' Please check the transaction id.'}`],
  }[action];
  notify(text[0], { type: 'booking', title: text[1], body: text[2], link: '/bookings' });

  sendSuccess(res, await populateBooking(Booking.findById(booking._id)), { message: `Payment ${result.to}` });
});
