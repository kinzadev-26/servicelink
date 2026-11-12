import axios from 'axios';

// One Axios instance for the whole app. The base URL comes from the environment (NFR-21).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

// Week 3: add a request interceptor that attaches "Authorization: Bearer <token>"
// and a response interceptor that logs the user out on a 401.

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
