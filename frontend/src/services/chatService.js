import api from './api.js';

// Pass a provider id (customers) or { customer: userId } (providers messaging someone who booked them).
export const startConversation = (target) => api.post('/conversations', typeof target === 'string' ? { provider: target } : target).then((r) => r.data);
export const getConversations = () => api.get('/conversations').then((r) => r.data);
export const getUnreadMessageCount = () => api.get('/conversations/unread-count').then((r) => r.data);
export const getMessages = (id, before) => api.get(`/conversations/${id}/messages`, { params: before ? { before } : {} }).then((r) => r.data);
export const sendMessage = (id, text) => api.post(`/conversations/${id}/messages`, { text }).then((r) => r.data);
export const markConversationRead = (id) => api.patch(`/conversations/${id}/read`).then((r) => r.data);

export const getNotifications = () => api.get('/notifications').then((r) => r.data);
export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`).then((r) => r.data);
export const markAllNotificationsRead = () => api.patch('/notifications/read-all').then((r) => r.data);
