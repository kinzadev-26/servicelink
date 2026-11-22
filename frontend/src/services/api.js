import axios from 'axios';

// One Axios instance for the whole app. The base URL comes from the environment (NFR-21).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

export const TOKEN_KEY = 'servicelink_token';
export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};
export const saveToken = (token) => {
  try { token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY); } catch { /* storage blocked */ }
};

// AuthContext registers a function here; it is called when the server says the token is no longer valid.
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

// Attach "Authorization: Bearer <token>" to every request.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// A 401 on a protected call means the token is missing, expired or wrong: log out and go to the login page.
// (A failed login attempt is also a 401, so those two URLs are skipped.)
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url || '';
    const isAuthForm = url.includes('/auth/login') || url.includes('/auth/register');
    if (error.response?.status === 401 && !isAuthForm) onUnauthorized();
    return Promise.reject(error);
  }
);

// A readable message for any failed request.
export function getErrorMessage(error) {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.request) return 'Cannot reach the server. Check that the API is running.';
  return error.message || 'Something went wrong';
}

// Field-level messages from a 400 response: { email: 'Email is not valid', ... }
export function getFieldErrors(error) {
  const list = error.response?.data?.errors;
  if (!Array.isArray(list)) return {};
  return Object.fromEntries(list.map((e) => [e.field, e.message]));
}

export default api;
