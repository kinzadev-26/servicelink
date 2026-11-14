import mongoose from 'mongoose';

const providerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    bio: { type: String, trim: true, maxlength: 500, default: '' },
    city: { type: String, required: [true, 'City is required'], trim: true },
    experienceYears: { type: Number, min: 0, max: 60, default: 0 },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    photoUrl: { type: String, default: '' },
    approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    rejectionReason: { type: String, default: '' },
    isPaused: { type: Boolean, default: false },
    avgRating: { type: Number, min: 0, max: 5, default: 0 },
    reviewCount: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true }
);

// Supports the search filters (NFR-8)
providerSchema.index({ city: 1, approvalStatus: 1, avgRating: -1 });

export default mongoose.model('Provider', providerSchema);
