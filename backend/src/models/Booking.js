import mongoose from 'mongoose';

export const ACTIVE_STATUSES = ['pending', 'confirmed'];

const bookingSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    date: { type: String, match: /^\d{4}-\d{2}-\d{2}$/, required: true }, // "2026-11-20"
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
    },
    address: { type: String, trim: true, maxlength: 200 },
    notes: { type: String, trim: true, maxlength: 300 },
    priceAtBooking: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

// Only one ACTIVE booking per provider, date and start time. Rejected or cancelled
// bookings are ignored, so a freed slot can be booked again (BKG-3).
bookingSchema.index(
  { provider: 1, date: 1, startTime: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ACTIVE_STATUSES } } }
);
bookingSchema.index({ customer: 1, date: -1 });

export default mongoose.model('Booking', bookingSchema);
