import Booking from '../models/Booking.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Provider from '../models/Provider.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/respond.js';
import { emitToUser } from '../socket.js';
import { getOrCreateConversation, postMessage } from '../services/chatService.js';

// Loads a conversation and makes sure the caller is one of the two people in it. Nobody else, not even an admin.
async function loadMine(req) {
  const conv = await Conversation.findById(req.params.id);
  if (!conv) throw new AppError('Conversation not found', 404);
  const me = req.user.id;
  if (conv.customer.toString() !== me && conv.provider.toString() !== me) {
    throw new AppError('You are not part of this conversation', 403);
  }
  return conv;
}
const otherUserId = (conv, me) => (conv.customer.toString() === me ? conv.provider : conv.customer).toString();

// POST /api/conversations
// Customer: { provider: <provider id> }.  Provider: { customer: <user id> }, only for a customer who has booked them.
export const startConversation = asyncHandler(async (req, res) => {
  let conv;
  if (req.user.role === 'customer') {
    if (!req.body.provider) throw new AppError('provider is required', 400);
    const provider = await Provider.findById(req.body.provider);
    if (!provider || provider.approvalStatus !== 'approved') throw new AppError('Provider not found', 404);
    conv = await getOrCreateConversation(req.user.id, provider.user);
  } else {
    if (!req.body.customer) throw new AppError('customer is required', 400);
    const mine = await Provider.findOne({ user: req.user.id }).select('_id');
    const hasBooked = mine && (await Booking.exists({ provider: mine._id, customer: req.body.customer }));
    if (!hasBooked) throw new AppError('You can only message customers who have booked you', 403);
    conv = await getOrCreateConversation(req.body.customer, req.user.id);
  }
  sendSuccess(res, { _id: conv._id }, { status: 201, message: 'Conversation ready' });
});

// GET /api/conversations  (my chats, newest activity first, with unread counts)
export const listConversations = asyncHandler(async (req, res) => {
  const me = req.user.id;
  const convs = await Conversation.find({ $or: [{ customer: me }, { provider: me }] })
    .populate('customer', 'name')
    .populate('provider', 'name')
    .sort({ lastMessageAt: -1 })
    .limit(50)
    .lean();

  const unread = await Message.aggregate([
    { $match: { conversation: { $in: convs.map((c) => c._id) }, sender: { $ne: req.user.objectId }, readAt: null } },
    { $group: { _id: '$conversation', count: { $sum: 1 } } },
  ]);
  const unreadBy = Object.fromEntries(unread.map((u) => [u._id.toString(), u.count]));

  sendSuccess(res, convs.map((c) => ({
    _id: c._id,
    other: c.customer._id.toString() === me ? c.provider : c.customer,
    lastMessage: c.lastMessage?.text || '',
    lastMessageAt: c.lastMessageAt,
    unread: unreadBy[c._id.toString()] || 0,
  })));
});

// GET /api/conversations/unread-count  (for the badge on the top bar)
export const unreadCount = asyncHandler(async (req, res) => {
  const mine = await Conversation.find({ $or: [{ customer: req.user.id }, { provider: req.user.id }] }).select('_id').lean();
  const count = await Message.countDocuments({ conversation: { $in: mine.map((c) => c._id) }, sender: { $ne: req.user.objectId }, readAt: null });
  sendSuccess(res, { count });
});

// GET /api/conversations/:id/messages?before=<date>  (latest 30, oldest first)
export const listMessages = asyncHandler(async (req, res) => {
  const conv = await loadMine(req);
  const filter = { conversation: conv._id };
  if (req.query.before) filter.createdAt = { $lt: new Date(req.query.before) };
  const messages = await Message.find(filter).sort({ createdAt: -1 }).limit(30).lean();
  sendSuccess(res, messages.reverse());
});

// POST /api/conversations/:id/messages
export const sendMessage = asyncHandler(async (req, res) => {
  const conv = await loadMine(req);
  const message = await postMessage(conv, req.user.id, req.body.text);
  sendSuccess(res, message, { status: 201, message: 'Sent' });
});

// PATCH /api/conversations/:id/read  (I opened the chat: mark their messages as read)
export const markRead = asyncHandler(async (req, res) => {
  const conv = await loadMine(req);
  const result = await Message.updateMany({ conversation: conv._id, sender: { $ne: req.user.objectId }, readAt: null }, { readAt: new Date() });
  if (result.modifiedCount > 0) {
    emitToUser(otherUserId(conv, req.user.id), 'conversation:read', { conversation: conv._id });
  }
  sendSuccess(res, { marked: result.modifiedCount });
});
