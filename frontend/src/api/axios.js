import axios from 'axios';

// -----------------------------------------------------------------------
// baseURL resolution, for both local dev AND a real deployment:
// - Locally: VITE_API_URL is unset, so we fall back to '/api/v1'. Vite's
//   dev server proxy (vite.config.js) forwards that to your local backend.
// - Deployed (e.g. on Vercel): there's no dev proxy anymore, since the
//   frontend and backend are two completely separate deployed services.
//   Setting VITE_API_URL as an environment variable in your hosting
//   dashboard points this at your real backend's public URL instead.
// -----------------------------------------------------------------------
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
