import axios from 'axios';
import { API_BASE_URL } from '../config/api';

/**
 * Resolve the best authorization token for order & invoice access.
 * Prioritizes adminToken when in the admin portal or when present.
 */
const getAuthToken = (orderId) => {
  const adminToken = localStorage.getItem('adminToken');
  const userToken = localStorage.getItem('token');
  const orderToken = orderId ? localStorage.getItem(`orderToken_${orderId}`) : null;

  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') && adminToken) {
    return adminToken;
  }
  return adminToken || userToken || orderToken || '';
};

/**
 * Trigger immediate download of the official invoice PDF
 * Uses Blob streaming to prevent blank tabs and avoid browser popup blockers.
 */
export const downloadInvoicePDF = async (orderId, fallbackFilename) => {
  const filename = fallbackFilename || `Invoice-ENNIGMA-${orderId}.pdf`;
  const token = getAuthToken(orderId);
  const config = {
    responseType: 'blob',
    ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
  };

  try {
    const url = `${API_BASE_URL}/orders/${orderId}/invoice?download=true${token ? `&token=${encodeURIComponent(token)}` : ''}`;
    const response = await axios.get(url, config);

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    }, 200);

    return true;
  } catch (error) {
    console.warn('Blob download failed, opening direct stream:', error);
    // Graceful fallback to direct navigation with query token
    const tokenQuery = token ? `&token=${encodeURIComponent(token)}` : '';
    window.open(`${API_BASE_URL}/orders/${orderId}/invoice?download=true${tokenQuery}`, '_blank');
    return false;
  }
};

/**
 * Open the official invoice PDF in a new tab for instant on-screen viewing and printing
 */
export const openInvoicePDF = (orderId) => {
  const token = getAuthToken(orderId);
  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : '';
  window.open(`${API_BASE_URL}/orders/${orderId}/invoice${tokenQuery}`, '_blank', 'noopener,noreferrer');
};
