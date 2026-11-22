// Vercel entry point: every request is handled by the same Express app used locally.
import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    console.error('Database connection failed:', err.message);
    return res.status(503).json({ success: false, message: 'Database unavailable. Please try again.' });
  }
  return app(req, res);
}
