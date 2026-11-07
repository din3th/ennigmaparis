import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

/** Thin React Query wrapper for GET endpoints under /api. */
export const useApiQuery = (key, path, options = {}) =>
  useQuery({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: async () => (await axios.get(`${API_BASE_URL}${path}`)).data,
    ...options,
  });

/** Store pricing rules (currency, shipping) as enforced by the server. */
export const usePricing = () =>
  useApiQuery('pricing', '/orders/pricing', {
    staleTime: 60 * 60 * 1000,
    placeholderData: { currency: 'LKR', freeShippingThreshold: 150, flatShippingRate: 15 },
  });

export const useAppearance = () => useApiQuery('appearance', '/appearance', { staleTime: 10 * 60 * 1000 });

export const formatMoney = (amount, currency = 'LKR') =>
  `${currency} ${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
