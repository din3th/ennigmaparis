import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const WishlistContext = createContext();

export const useWishlist = () => useContext(WishlistContext);

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState(() => {
    const saved = localStorage.getItem('wishlistItems');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('wishlistItems', JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  const toggleWishlist = async (product) => {
    const productId = product._id || product.id;
    const exists = wishlistItems.some((item) => (item._id || item.id) === productId);

    if (exists) {
      setWishlistItems((prev) => prev.filter((item) => (item._id || item.id) !== productId));
    } else {
      setWishlistItems((prev) => [...prev, product]);
    }

    // Synchronize with server if logged in
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
    if (token && productId) {
      try {
        await axios.post(
          `${API_BASE_URL}/wishlist/toggle`,
          { productId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        // Silent catch for resilient offline or non-blocking operation
        console.warn('Backend wishlist sync warning:', err.message);
      }
    }
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some((item) => (item._id || item.id) === productId);
  };

  const clearWishlist = () => {
    setWishlistItems([]);
  };

  return (
    <WishlistContext.Provider value={{ wishlistItems, toggleWishlist, isInWishlist, clearWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};
