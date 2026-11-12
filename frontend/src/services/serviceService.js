import api from './api.js';

export const getServices = (params) => api.get('/services', { params }).then((res) => res.data);
export const getService = (id) => api.get(`/services/${id}`).then((res) => res.data);
export const createService = (values) => api.post('/services', values).then((res) => res.data);
export const updateService = (id, values) => api.put(`/services/${id}`, values).then((res) => res.data);
export const deleteService = (id) => api.delete(`/services/${id}`).then((res) => res.data);
