import mongoose from 'mongoose';

// One conversation per customer and provider pair. Both ids are USER ids, because messages are between people.
const conversationSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lastMessage: {
      text: { type: String, default: '' },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

conversationSchema.index({ customer: 1, provider: 1 }, { unique: true });
conversationSchema.index({ provider: 1, lastMessageAt: -1 });
conversationSchema.index({ customer: 1, lastMessageAt: -1 });

export default mongoose.model('Conversation', conversationSchema);
