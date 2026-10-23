export const isProduction = Boolean(import.meta.env.PROD) || (
  typeof window !== 'undefined' && 
  window.location.hostname !== 'localhost' && 
  window.location.hostname !== '127.0.0.1'
);

// Seamless relative /api route: Proxied to http://localhost:3001 in Vite dev, and handled by Vercel serverless in production
export const API_BASE_URL = '/api';

export const BACKEND_URL = '';

/**
 * Resolves an image URL safely across local and production environments.
 * Strips localhost:3001 so images are always fetched as relative /uploads paths through Vite proxy or Vercel rewrite.
 */
export const resolveImageUrl = (imgUrl) => {
  if (!imgUrl) return '/placeholder.jpg';
  
  if (imgUrl.includes('localhost:3001/uploads')) {
    return imgUrl.replace(/^https?:\/\/localhost:3001/, '');
  }

  if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://') || imgUrl.startsWith('data:')) {
    return imgUrl;
  }

  if (imgUrl.startsWith('/uploads')) {
    return imgUrl;
  }

  return imgUrl;
};
