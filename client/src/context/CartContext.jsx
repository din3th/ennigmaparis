import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('cartItems');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, qty, size) => {
    const existingItem = cartItems.find((x) => x.product === product._id && x.size === size);
    
    if (existingItem) {
      setCartItems(cartItems.map((x) => 
        x.product === existingItem.product && x.size === existingItem.size ? { ...x, qty: x.qty + qty } : x
      ));
    } else {
      setCartItems([...cartItems, { 
        product: product._id, 
        name: product.name,
        slug: product.slug, 
        image: product.images[0], 
        price: product.price, 
        size, 
        qty 
      }]);
    }
  };

  const removeFromCart = (id, size) => {
    setCartItems(cartItems.filter((x) => !(x.product === id && x.size === size)));
  };

  const updateQty = (id, size, qty) => {
    setCartItems(cartItems.map((x) => 
      x.product === id && x.size === size ? { ...x, qty } : x
    ));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce((acc, item) => acc + item.qty * item.price, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQty, clearCart, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
};
