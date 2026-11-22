import api from './api.js';

export const getSlots = (providerId, date) => api.get(`/providers/${providerId}/slots`, { params: { date } }).then((r) => r.data);
export const createBooking = (values) => api.post('/bookings', values).then((r) => r.data);
export const getMyBookings = (params) => api.get('/bookings', { params }).then((r) => r.data);
export const updateBookingStatus = (id, status, reason) => api.patch(`/bookings/${id}/status`, { status, reason }).then((r) => r.data);
export const updatePayment = (id, values) => api.patch(`/bookings/${id}/payment`, values).then((r) => r.data);
export const createReview = (bookingId, values) => api.post(`/bookings/${bookingId}/review`, values).then((r) => r.data);
export const getProviderReviews = (providerId) => api.get(`/providers/${providerId}/reviews`).then((r) => r.data);
