import axios from 'axios';
import { API_BASE_URL } from '../config/api';

/**
 * Session handling. The session itself is an httpOnly cookie set by the API,
 * so page JavaScript never sees the token. We only keep the non-secret profile
 * (name, email, role) in localStorage to render the UI.
 */
const USER_KEY = 'userInfo';
const LEGACY_KEYS = ['token', 'adminToken', 'adminInfo'];

export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const isAdminUser = () => getCurrentUser()?.role === 'admin';

export const setCurrentUser = (user) => {
  const { _id, name, email, role, phone, address } = user || {};
  try {
    localStorage.setItem(USER_KEY, JSON.stringify({ _id, name, email, role, phone, address }));
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
  } catch {
    // storage unavailable (private mode): UI falls back to signed-out view
  }
};

export const clearCurrentUser = () => {
  try {
    [USER_KEY, ...LEGACY_KEYS].forEach((k) => localStorage.removeItem(k));
    Object.keys(localStorage)
      .filter((k) => k.startsWith('orderToken_'))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
};

export const signOut = async () => {
  try {
    await axios.post(`${API_BASE_URL}/users/logout`);
  } finally {
    clearCurrentUser();
  }
};

/** Global axios setup: send cookies and the CSRF header, and drop stale sessions on 401. */
export const configureHttp = () => {
  axios.defaults.withCredentials = true;
  axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
  axios.interceptors.response.use(
    (res) => res,
    (error) => {
      const url = error.config?.url || '';
      if (error.response?.status === 401 && !url.endsWith('/users/login') && getCurrentUser()) {
        clearCurrentUser();
      }
      return Promise.reject(error);
    }
  );
};
