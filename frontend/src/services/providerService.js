import api from './api.js';

export const getProviders = (params) => api.get('/providers', { params }).then((res) => res.data);
export const getProvider = (id) => api.get(`/providers/${id}`).then((res) => res.data);
