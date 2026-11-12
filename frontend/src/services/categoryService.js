import api from './api.js';

export const getCategories = () => api.get('/categories').then((res) => res.data);
