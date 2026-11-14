import mongoose from 'mongoose';

const ruleSchema = new mongoose.Schema(
  {
    dayOfWeek: { type: Number, min: 0, max: 6, required: true }, // 0 = Sunday
    startTime: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/, required: true }, // "10:00"
    endTime: { type: String, match: /^([01]\d|2[0-3]):[0-5]\d$/, required: true },
  },
  { _id: false }
);

// Used from Week 3 (slot generation). The model exists now so the database matches the design.
const availabilitySchema = new mongoose.Schema(
  {
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true, unique: true },
    weekly: [ruleSchema],
    slotMinutes: { type: Number, enum: [30, 60, 90, 120], default: 60 },
    daysOff: [{ type: String, match: /^\d{4}-\d{2}-\d{2}$/ }],
  },
  { timestamps: true }
);

export default mongoose.model('Availability', availabilitySchema);
