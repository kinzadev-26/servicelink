import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import { recalculateRating } from '../services/ratingService.js';
import Provider from '../models/Provider.js';
import { notify } from '../services/notificationService.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/respond.js';

// POST /api/bookings/:id/review  (customer who owns a completed booking, once)
export const createReview = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new AppError('Booking not found', 404);
  if (booking.customer.toString() !== req.user.id) throw new AppError('You can only review your own bookings', 403);
  if (booking.status !== 'completed') throw new AppError('You can review a booking only after it is completed', 400);

  let review;
  try {
    review = await Review.create({
      booking: booking._id,
      customer: req.user.id,
      provider: booking.provider,
      rating: req.body.rating,
      comment: req.body.comment,
    });
  } catch (err) {
    if (err.code === 11000) throw new AppError('You have already reviewed this booking', 409);
    throw err;
  }
  await recalculateRating(booking.provider);
  const providerDoc = await Provider.findById(booking.provider).select('user');
  if (providerDoc) notify(providerDoc.user, { type: 'review', title: 'New review', body: `${req.user.name} gave you ${req.body.rating} out of 5`, link: '/dashboard' });
  sendSuccess(res, review, { status: 201, message: 'Thanks for your review' });
});

// DELETE /api/reviews/:id  (admin moderation)
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('Review not found', 404);
  await review.deleteOne();
  await recalculateRating(review.provider);
  sendSuccess(res, null, { message: 'Review removed' });
});
