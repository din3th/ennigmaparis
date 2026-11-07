import axios from 'axios';
import { API_BASE_URL } from '../config/api';

/*
 * Invoices are authorized by the httpOnly session cookie (signed-in users and
 * admins) or the order-access cookie (the guest browser that placed the order).
 * No tokens are put in URLs.
 */

/** Download the invoice PDF as a file. */
export const downloadInvoicePDF = async (orderId, fallbackFilename) => {
  const filename = fallbackFilename || `Invoice-ENNIGMA-${orderId}.pdf`;
  const url = `${API_BASE_URL}/orders/${orderId}/invoice?download=true`;

  try {
    const response = await axios.get(url, { responseType: 'blob' });
    const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));

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
    console.warn('Invoice download failed, opening directly:', error);
    window.open(url, '_blank', 'noopener,noreferrer');
    return false;
  }
};

/** Open the invoice PDF in a new tab for viewing and printing. */
export const openInvoicePDF = (orderId) => {
  window.open(`${API_BASE_URL}/orders/${orderId}/invoice`, '_blank', 'noopener,noreferrer');
};
