import api from './api.js';

export const getStats = () => api.get('/admin/stats').then((r) => r.data);
export const getAdminProviders = (params) => api.get('/admin/providers', { params }).then((r) => r.data);
export const setProviderApproval = (id, approvalStatus, rejectionReason) => api.patch(`/admin/providers/${id}/approval`, { approvalStatus, rejectionReason }).then((r) => r.data);
export const getAdminUsers = (params) => api.get('/admin/users', { params }).then((r) => r.data);
export const setUserStatus = (id, isActive) => api.patch(`/admin/users/${id}/status`, { isActive }).then((r) => r.data);
export const getAdminBookings = (params) => api.get('/admin/bookings', { params }).then((r) => r.data);
