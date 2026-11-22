import mongoose from 'mongoose';

const ruleSchema = new mongoose.Schema(
  {
    dayOfWeek: { type: Number, min: 0, max: 6, required: true }, // 0 = Sunday
    startTime: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/, required: true }, // "10:00"
    endTime: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/, required: true },
  },
  { _id: false }
);

// Weekly working hours, days off and slot length. getFreeSlots() in slotService turns this into bookable slots.
const availabilitySchema = new mongoose.Schema(
  {
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true, unique: true },
    weekly: [ruleSchema],
    slotMinutes: { type: Number, enum: [30, 45, 60, 90, 120, 180], default: 60 },
    daysOff: [{ type: String, match: /^\d{4}-\d{2}-\d{2}$/ }],
  },
  { timestamps: true }
);

export default mongoose.model('Availability', availabilitySchema);
