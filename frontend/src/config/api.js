// Centralized API configuration for Development and Production
const envUrl = import.meta.env.VITE_API_URL;

// If VITE_API_URL is provided (e.g. in separate Vercel/Netlify deployment), use it.
// In development without VITE_API_URL, default to 'http://localhost:5000'.
// In production without VITE_API_URL, default to '' (same-origin relative URL for unified deployment).
export const API_BASE_URL = envUrl
  ? envUrl.replace(/\/$/, '')
  : (import.meta.env.DEV ? 'http://localhost:5000' : '');

export const apiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

export default apiUrl;
