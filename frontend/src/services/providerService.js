import api from './api.js';

export const getProviders = (params) => api.get('/providers', { params }).then((res) => res.data);
export const getProvider = (id) => api.get(`/providers/${id}`).then((res) => res.data);
export const getMyProvider = () => api.get('/providers/me').then((res) => res.data);
export const updateMyProvider = (values) => api.put('/providers/me', values).then((res) => res.data);
export const getMyAvailability = () => api.get('/availability/me').then((res) => res.data);
export const saveMyAvailability = (values) => api.put('/availability/me', values).then((res) => res.data);
