import Notification from '../models/Notification.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/respond.js';

// GET /api/notifications  (latest 20 plus the unread total)
export const listNotifications = asyncHandler(async (req, res) => {
  const [items, unread] = await Promise.all([
    Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(20).lean(),
    Notification.countDocuments({ user: req.user.id, readAt: null }),
  ]);
  sendSuccess(res, { items, unread });
});

// PATCH /api/notifications/read-all
export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user.id, readAt: null }, { readAt: new Date() });
  sendSuccess(res, null, { message: 'All notifications marked as read' });
});

// PATCH /api/notifications/:id/read  (only my own)
export const markOneRead = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, { readAt: new Date() }, { new: true });
  if (!n) throw new AppError('Notification not found', 404);
  sendSuccess(res, n);
});
