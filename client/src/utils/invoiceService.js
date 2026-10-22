import axios from 'axios';
import { API_BASE_URL } from '../config/api';

/**
 * Trigger immediate download of the official invoice PDF
 * Uses Blob streaming to prevent blank tabs and avoid browser popup blockers.
 */
export const downloadInvoicePDF = async (orderId, fallbackFilename) => {
  const filename = fallbackFilename || `Invoice-ENNIGMA-${orderId}.pdf`;
  try {
    const response = await axios.get(`${API_BASE_URL}/orders/${orderId}/invoice?download=true`, {
      responseType: 'blob',
    });

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
    // Graceful fallback to direct navigation
    window.open(`${API_BASE_URL}/orders/${orderId}/invoice?download=true`, '_blank');
    return false;
  }
};

/**
 * Open the official invoice PDF in a new tab for instant on-screen viewing and printing
 */
export const openInvoicePDF = (orderId) => {
  window.open(`${API_BASE_URL}/orders/${orderId}/invoice`, '_blank', 'noopener,noreferrer');
};
