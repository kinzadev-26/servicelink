import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    title: { type: String, required: [true, 'Title is required'], trim: true, minlength: 3, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    // Whole PKR amount, never a float (NFR-13)
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [1, 'Price must be at least 1'],
      validate: { validator: Number.isInteger, message: 'Price must be a whole number' },
    },
    durationMinutes: { type: Number, min: 15, max: 480, default: 60 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

serviceSchema.index({ category: 1, price: 1 });
serviceSchema.index({ provider: 1 });

export default mongoose.model('Service', serviceSchema);
