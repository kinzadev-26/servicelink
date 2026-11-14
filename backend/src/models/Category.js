import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Category name is required'], unique: true, trim: true, maxlength: 40 },
    slug: { type: String, unique: true, lowercase: true },
    icon: { type: String, default: '' },
  },
  { timestamps: true }
);

// Build the slug from the name before validation runs.
categorySchema.pre('validate', function () {
  if (this.name) this.slug = this.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
});

export default mongoose.model('Category', categorySchema);
