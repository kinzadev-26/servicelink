import mongoose from 'mongoose';
import { env } from './env.js';

// Safe to call many times. On Vercel every request may reach a "warm" function that already
// has a connection, so we reuse it instead of opening a new one each time.
let connecting = null;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  if (!connecting) {
    connecting = mongoose
      .connect(env.mongoUri, { serverSelectionTimeoutMS: 8000 })
      .then(() => console.log(`MongoDB connected: ${mongoose.connection.name}`))
      .catch((err) => { connecting = null; throw err; });
  }
  await connecting;
}
