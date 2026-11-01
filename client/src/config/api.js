export const isProduction = Boolean(import.meta.env.PROD) || (
  typeof window !== 'undefined' && 
  window.location.hostname !== 'localhost' && 
  window.location.hostname !== '127.0.0.1'
);

// Seamless relative /api route: Proxied to http://localhost:3001 in Vite dev, and handled by Vercel serverless in production
export const API_BASE_URL = '/api';

export const BACKEND_URL = '';

export const DEFAULT_PLACEHOLDER = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop';

/**
 * Resolves an image URL safely across local and production environments.
 * Strips localhost:3001 so images are always fetched as relative /uploads paths through Vite proxy or Vercel rewrite.
 */
export const resolveImageUrl = (imgUrl) => {
  if (!imgUrl || typeof imgUrl !== 'string') return DEFAULT_PLACEHOLDER;
  
  if (imgUrl.includes('localhost:3001/uploads') || imgUrl.includes('127.0.0.1:3001/uploads')) {
    return imgUrl.replace(/^https?:\/\/(localhost|127\.0\.0\.1):3001/, '');
  }

  if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://') || imgUrl.startsWith('data:')) {
    return imgUrl;
  }

  if (imgUrl.startsWith('uploads/')) {
    return '/' + imgUrl;
  }

  if (imgUrl.startsWith('/uploads')) {
    return imgUrl;
  }

  return imgUrl || DEFAULT_PLACEHOLDER;
};
