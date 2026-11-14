import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, minlength: 2, maxlength: 60 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email is not valid'],
    },
    // select:false keeps the hash out of normal queries (NFR-1)
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['customer', 'provider', 'admin'], default: 'customer' },
    phone: { type: String, trim: true },
    city: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
