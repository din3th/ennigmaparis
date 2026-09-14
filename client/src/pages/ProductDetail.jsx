import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { API_BASE_URL } from '../config/api';


const ProductDetail = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  
  // Review state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewMessage, setReviewMessage] = useState(null);
  const [reviewError, setReviewError] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Back-in-stock state
  const [backInStockEmail, setBackInStockEmail] = useState('');
  const [notifyMessage, setNotifyMessage] = useState(null);
  const [submittingNotify, setSubmittingNotify] = useState(false);

  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/products/${slug}`);
        setProduct(data);
        if (data.sizes && data.sizes.length > 0) {
          setSelectedSize(data.sizes[0]);
        }
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (product) {
      addToCart(product, 1, selectedSize || 'One Size');
      navigate('/cart');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!comment) return;

    setSubmittingReview(true);
    setReviewMessage(null);
    setReviewError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setReviewError('Please sign in to leave a product review.');
        setSubmittingReview(false);
        return;
      }

      await axios.post(
        `${API_BASE_URL}/products/${product._id || product.id}/reviews`,
        { rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReviewMessage('Review submitted successfully!');
      setComment('');
      
      // Refresh product details
      const { data } = await axios.get(`${API_BASE_URL}/products/${slug}`);
      setProduct(data);
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleBackInStockSubmit = async (e) => {
    e.preventDefault();
    if (!backInStockEmail) return;

    setSubmittingNotify(true);
    setNotifyMessage(null);

    try {
      const { data } = await axios.post(`${API_BASE_URL}/products/${product._id || product.id}/notify`, {
        email: backInStockEmail,
        variantInfo: selectedSize,
      });

      setNotifyMessage(data.message || 'Notification request registered!');
      setBackInStockEmail('');
    } catch (err) {
      setNotifyMessage('Failed to register notification request');
    } finally {
      setSubmittingNotify(false);
    }
  };

  if (loading) return <div className="py-24 text-center min-h-[60vh]">Loading luxury details...</div>;

  if (!product) {
    return (
      <div className="py-24 text-center min-h-[60vh] flex flex-col justify-center items-center">
        <h1 className="text-2xl font-serif tracking-widest uppercase">Piece Not Found</h1>
        <Link to="/shop" className="mt-8 underline text-gray-600">Return to Catalog</Link>
      </div>
    );
  }

  const isWishlisted = isInWishlist(product._id || product.id);

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
      <div className="lg:grid lg:grid-cols-2 lg:gap-x-12">
        {/* Product Images */}
        <div className="flex flex-col space-y-4">
          <div className="aspect-[3/4] w-full bg-gray-100 overflow-hidden relative rounded-sm">
            <img 
              src={product.images && product.images[0] ? product.images[0] : '/placeholder.jpg'} 
              alt={product.name} 
              className="object-cover w-full h-full"
            />
            {product.stock === 0 && (
              <span className="absolute top-4 left-4 bg-red-600 text-white text-xs uppercase font-bold tracking-widest px-3 py-1">
                Out of Stock
              </span>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-2 gap-4">
              {product.images.slice(1).map((img, idx) => (
                <div key={idx} className="aspect-[3/4] bg-gray-100 overflow-hidden rounded-sm">
                  <img src={img} alt="Detail view" className="object-cover w-full h-full" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="mt-10 px-4 sm:px-0 lg:mt-0 sticky top-24 self-start space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">{product.category}</span>
              <h1 className="text-3xl font-serif tracking-wide uppercase text-gray-900 mt-1">{product.name}</h1>
            </div>
            <button
              onClick={() => toggleWishlist(product)}
              className="p-3 rounded-full border border-gray-200 hover:border-black transition-colors"
              aria-label="Wishlist toggle"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`w-5 h-5 ${isWishlisted ? 'fill-red-600 stroke-red-600' : 'fill-none stroke-current text-gray-700'}`} 
                viewBox="0 0 24 24" 
                strokeWidth="1.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <p className="text-2xl font-medium text-gray-900">LKR {product.price ? product.price.toLocaleString('en-US') : '0'}</p>
            {product.salePrice && (
              <span className="line-through text-gray-400 text-lg">LKR {product.salePrice.toLocaleString('en-US')}</span>
            )}
            {product.rating > 0 && (
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                ★ {product.rating.toFixed(1)} ({product.numReviews} reviews)
              </span>
            )}
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-xs font-bold tracking-widest uppercase text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap font-sans">
              {product.description || "Designed in Paris. Crafted with high-grade Italian fabrics and meticulous craftsmanship."}
            </p>
          </div>

          {/* Size Selector */}
          <div className="border-t border-gray-100 pt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold tracking-widest uppercase text-gray-900">Select Size</h3>
              <a href="#" className="text-xs text-gray-400 underline hover:text-black">Size Guide</a>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {product.sizes && product.sizes.length > 0 ? (
                product.sizes.map(size => (
                  <button 
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`py-3 text-xs font-medium focus:outline-none transition-colors border ${selectedSize === size ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-black text-gray-900'}`}
                  >
                    {size}
                  </button>
                ))
              ) : (
                <span className="text-gray-500 text-xs">Standard Fit</span>
              )}
            </div>
          </div>

          {/* Add to Cart or Back in Stock Form */}
          {product.stock === 0 ? (
            <div className="bg-gray-50 p-6 border border-gray-200 rounded-sm">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-1">
                Currently Out of Stock
              </h4>
              <p className="text-xs text-gray-500 mb-4 font-sans">
                Enter your email below to be notified immediately when this piece is restocked.
              </p>
              <form onSubmit={handleBackInStockSubmit} className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={backInStockEmail}
                  onChange={(e) => setBackInStockEmail(e.target.value)}
                  required
                  className="flex-1 border border-gray-300 p-3 text-xs focus:border-black focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={submittingNotify}
                  className="bg-black text-white px-6 py-3 text-xs uppercase font-bold tracking-wider hover:bg-gray-800 disabled:opacity-50"
                >
                  {submittingNotify ? '...' : 'Notify Me'}
                </button>
              </form>
              {notifyMessage && (
                <p className="text-xs text-green-700 font-medium mt-2">{notifyMessage}</p>
              )}
            </div>
          ) : (
            <form onSubmit={handleAddToCart}>
              <button
                type="submit"
                className="w-full bg-black py-4 text-xs font-bold tracking-widest uppercase text-white hover:bg-gray-800 transition-colors cursor-pointer shadow-md"
              >
                Add to Shopping Bag
              </button>
            </form>
          )}

          {/* Reviews Section */}
          <div className="border-t border-gray-100 pt-8 mt-12 space-y-6">
            <h3 className="text-sm font-bold tracking-widest uppercase text-gray-900">
              Customer Reviews ({product.reviews ? product.reviews.length : 0})
            </h3>

            {/* Existing Reviews */}
            {product.reviews && product.reviews.length > 0 ? (
              <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                {product.reviews.map((rev, idx) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-900">{rev.name}</span>
                      <span className="text-xs text-amber-600">{'★'.repeat(rev.rating)}</span>
                    </div>
                    <p className="text-xs text-gray-600 font-sans">{rev.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 font-sans">No reviews yet for this piece. Be the first to leave a review.</p>
            )}

            {/* Leave a Review */}
            <form onSubmit={handleReviewSubmit} className="bg-gray-50 p-4 border border-gray-100 space-y-3 rounded-sm">
              <span className="block text-xs font-bold uppercase tracking-wider text-gray-800">Write a Review</span>
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Rating</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full border border-gray-200 p-2 text-xs focus:border-black focus:outline-none"
                >
                  <option value={5}>5 Stars - Excellent</option>
                  <option value={4}>4 Stars - Very Good</option>
                  <option value={3}>3 Stars - Average</option>
                  <option value={2}>2 Stars - Poor</option>
                  <option value={1}>1 Star - Terrible</option>
                </select>
              </div>
              <div>
                <textarea
                  rows={3}
                  placeholder="Share details of your fit, fabric, and overall experience..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                  className="w-full border border-gray-200 p-2.5 text-xs focus:border-black focus:outline-none"
                />
              </div>
              {reviewError && <p className="text-xs text-red-600">{reviewError}</p>}
              {reviewMessage && <p className="text-xs text-green-700">{reviewMessage}</p>}
              <button
                type="submit"
                disabled={submittingReview}
                className="bg-black text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-gray-800 disabled:opacity-50"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
