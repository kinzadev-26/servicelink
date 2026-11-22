import { Router } from 'express';
import { createBooking, getBooking, listMyBookings, updateBookingStatus, updatePayment } from '../controllers/bookingController.js';
import { createReview } from '../controllers/reviewController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { bookingListRules, createBookingRules, paymentRules, reviewRules, statusRules } from '../validators/bookingValidators.js';
import { idParam } from '../validators/common.js';

const router = Router();
router.use(authenticate);

router.post('/', authorize('customer'), createBookingRules, validate, createBooking);
router.get('/', authorize('customer', 'provider'), bookingListRules, validate, listMyBookings);
router.get('/:id', idParam, validate, getBooking);
router.patch('/:id/status', authorize('customer', 'provider'), idParam, statusRules, validate, updateBookingStatus);
router.patch('/:id/payment', authorize('customer', 'provider'), idParam, paymentRules, validate, updatePayment);
router.post('/:id/review', authorize('customer'), idParam, reviewRules, validate, createReview);

export default router;
