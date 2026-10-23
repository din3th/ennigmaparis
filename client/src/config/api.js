const isProduction = typeof window !== 'undefined' && 
  window.location.hostname !== 'localhost' && 
  window.location.hostname !== '127.0.0.1';

export const API_BASE_URL = (() => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (isProduction) {
    // If hosted on Vercel or same origin, use relative /api unless custom backend explicitly defined (excluding netlify)
    if (!envUrl || envUrl.includes('netlify.app')) {
      return '/api';
    }
    return envUrl;
  }
  return envUrl || 'http://localhost:3001/api';
})();

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 
  (isProduction ? '' : 'http://localhost:3001');

/**
 * Resolves an image URL safely across local and production (Vercel/Netlify) environments.
 * If the image is a relative upload (/uploads/...), it prepends the backend host in dev,
 * or keeps relative in production.
 */
export const resolveImageUrl = (imgUrl) => {
  if (!imgUrl) return '/placeholder.jpg';
  if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://') || imgUrl.startsWith('data:')) {
    return imgUrl;
  }
  if (imgUrl.startsWith('/uploads')) {
    return `${BACKEND_URL}${imgUrl}`;
  }
  return imgUrl;
};
