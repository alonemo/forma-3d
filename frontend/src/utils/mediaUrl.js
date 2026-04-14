/**
 * Prefixes a relative /uploads/... path with the backend base URL.
 * In dev the Vite proxy handles it (VITE_API_URL is empty).
 * In production VITE_API_URL = https://your-backend.railway.app
 */
export const mediaUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path; // already absolute
  return `${import.meta.env.VITE_API_URL || ''}${path}`;
};
