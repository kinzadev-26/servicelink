import api from './api.js';

export const registerUser = (values) => api.post('/auth/register', values).then((r) => r.data);
export const loginUser = (values) => api.post('/auth/login', values).then((r) => r.data);
export const getMe = () => api.get('/auth/me').then((r) => r.data);
