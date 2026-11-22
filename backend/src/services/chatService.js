import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { emitToUser } from '../socket.js';

// One conversation per customer and provider (both are USER ids). Creates it if it does not exist yet.
export const getOrCreateConversation = (customerId, providerUserId) =>
  Conversation.findOneAndUpdate(
    { customer: customerId, provider: providerUserId },
    { $setOnInsert: { customer: customerId, provider: providerUserId } },
    { new: true, upsert: true }
  );

// Saves a message, updates the chat's "last message", and pushes it live to both people.
export async function postMessage(conv, senderId, text) {
  const message = (await Message.create({ conversation: conv._id, sender: senderId, text })).toObject();
  conv.lastMessage = { text: message.text.slice(0, 100), sender: senderId };
  conv.lastMessageAt = message.createdAt;
  await conv.save();

  const recipient = (conv.customer.toString() === senderId.toString() ? conv.provider : conv.customer).toString();
  const payload = { ...message, sender: senderId.toString() };
  emitToUser(recipient, 'message:new', payload);
  emitToUser(senderId.toString(), 'message:new', payload);
  return message;
}
