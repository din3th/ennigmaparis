import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const ProductCard = ({ product }) => {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const productId = product._id || product.id;
  const isWishlisted = isInWishlist(productId);

  const availableSizes = product.sizes && product.sizes.length > 0
    ? product.sizes
    : ['UK 6', 'UK 8', 'UK 10', 'UK 12', 'UK 14'];

  const handleQuickAdd = (e, size) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1, size);
    setIsQuickAddOpen(false);
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div 
      className="group block relative" 
      onMouseLeave={() => setIsQuickAddOpen(false)}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-100 mb-4 rounded-sm">
        <Link to={`/shop/${product.slug || product.handle || product._id}`}>
          <img 
            src={product.images && product.images[0] ? product.images[0] : '/placeholder.jpg'}
            alt={product.title || product.name}
            className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-700"
          />
          {product.images && product.images[1] && (
            <img 
              src={product.images[1]}
              alt={product.title || product.name}
              className="absolute inset-0 object-cover w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"
            />
          )}
        </Link>

        {/* Wishlist Heart Button */}
        <button
          onClick={handleWishlistToggle}
          aria-label="Add to wishlist"
          className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-md hover:bg-white text-gray-800 transition-colors z-20 shadow-sm cursor-pointer"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`w-4 h-4 transition-colors ${isWishlisted ? 'fill-red-600 stroke-red-600' : 'fill-none stroke-current'}`} 
            viewBox="0 0 24 24" 
            strokeWidth="1.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </button>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10 pointer-events-none">
          {product.isFeatured && (
            <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-black text-white">
              Featured
            </span>
          )}
          {product.stock === 0 && (
            <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-red-600 text-white">
              Out of Stock
            </span>
          )}
        </div>
      </div>
      
      {/* Quick Add Overlay */}
      <div className="absolute inset-x-0 bottom-[4.5rem] p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none group-hover:pointer-events-auto flex flex-col justify-end">
        <AnimatePresence>
          {!isQuickAddOpen ? (
            <motion.button 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={(e) => {
                e.preventDefault();
                setIsQuickAddOpen(true);
              }}
              className="w-full bg-white/95 backdrop-blur-sm text-black py-3 text-xs font-bold tracking-widest uppercase hover:bg-black hover:text-white transition-colors shadow-md cursor-pointer border border-gray-200"
            >
              Quick Add
            </motion.button>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="w-full bg-white/95 backdrop-blur-sm shadow-lg p-3 flex flex-wrap gap-2 justify-center border border-gray-200 rounded-sm"
            >
              <div className="w-full text-center text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Select Size</div>
              {availableSizes.map((size) => (
                <button 
                  key={size}
                  onClick={(e) => handleQuickAdd(e, size)}
                  className="px-2.5 py-1 text-xs border border-gray-300 hover:border-black hover:bg-black hover:text-white transition-colors cursor-pointer"
                >
                  {size}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Link to={`/shop/${product.slug || product.handle || product._id}`}>
        <div>
          <h3 className="text-sm font-medium text-gray-900 group-hover:text-gray-600 transition-colors uppercase font-heading tracking-wide">
            {product.title || product.name}
          </h3>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-sm text-gray-900 font-medium">
              LKR {product.price ? product.price.toLocaleString('en-US') : '0'}
              {product.salePrice && (
                <span className="ml-2 line-through text-gray-400 text-xs">LKR {product.salePrice.toLocaleString('en-US')}</span>
              )}
            </p>
            {product.rating > 0 && (
              <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                ★ {product.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
