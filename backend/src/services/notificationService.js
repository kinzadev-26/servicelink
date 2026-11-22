import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { emitToUser } from '../socket.js';

// Saves a notification and pushes it live to the user. It must never break the request that caused it,
// so any failure is only logged.
export async function notify(userId, { type = 'system', title, body = '', link = '' }) {
  try {
    const doc = await Notification.create({ user: userId, type, title, body, link });
    emitToUser(userId.toString(), 'notification', doc.toObject());
    return doc;
  } catch (err) {
    console.error('notify failed:', err.message);
    return null;
  }
}

export async function notifyAdmins(payload) {
  try {
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id').lean();
    await Promise.all(admins.map((a) => notify(a._id, payload)));
  } catch (err) {
    console.error('notifyAdmins failed:', err.message);
  }
}
