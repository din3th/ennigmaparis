import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, Menu, User, ChevronDown, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const MainLayout = () => {
  const { cartItems } = useCart();
  const { wishlistItems } = useWishlist();
  const cartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);
  const wishlistCount = wishlistItems.length;

  const navigate = useNavigate();
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterMsg, setNewsletterMsg] = useState(null);
  const [isSubmittingNewsletter, setIsSubmittingNewsletter] = useState(false);

  const isAdmin = !!localStorage.getItem('adminToken');
  const storedUser = localStorage.getItem('userInfo');
  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    navigate(0);
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;

    setIsSubmittingNewsletter(true);
    setNewsletterMsg(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/admin/newsletter/subscribe`, {
        email: newsletterEmail,
      });
      setNewsletterMsg(response.data.message);
      setNewsletterEmail('');
    } catch (err) {
      setNewsletterMsg('Failed to subscribe. Please try again.');
    } finally {
      setIsSubmittingNewsletter(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen font-sans">
      {/* Navbar */}
      <header 
        className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100"
        onMouseLeave={() => setIsMegaMenuOpen(false)}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
              <button className="text-gray-900 p-2">
                <Menu size={24} />
              </button>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8 h-full items-center">
              <div 
                className="relative h-full flex items-center cursor-pointer"
                onMouseEnter={() => setIsMegaMenuOpen(true)}
              >
                <span className="text-xs font-bold tracking-widest uppercase text-gray-900 hover:text-gray-600 transition-colors flex items-center gap-1">
                  COLLECTIONS <ChevronDown size={14} className={`transition-transform duration-300 ${isMegaMenuOpen ? 'rotate-180' : ''}`} />
                </span>
              </div>
              <Link to="/shop?category=women" className="text-xs font-bold tracking-widest uppercase text-gray-900 hover:text-gray-600 transition-colors">
                WOMEN
              </Link>
              <Link to="/shop?collection=the-calm-edit" className="text-xs font-bold tracking-widest uppercase text-gray-900 hover:text-gray-600 transition-colors">
                THE CALM EDIT
              </Link>
            </nav>

            {/* Logo */}
            <div className="flex-shrink-0 flex items-center justify-center absolute left-1/2 transform -translate-x-1/2">
              <Link to="/" className="text-2xl font-serif font-bold tracking-[0.25em] uppercase text-gray-900">
                ENNIGMA
              </Link>
            </div>

            {/* Icons */}
            <div className="flex items-center space-x-3">
              <Link to="/wishlist" aria-label="Wishlist" className="text-gray-900 p-2 hover:text-gray-600 transition-colors relative">
                <Heart size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold leading-none text-white bg-red-600 rounded-full">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              
              <div className="relative group">
                <button className="text-gray-900 p-2 hover:text-gray-600 transition-colors flex items-center gap-1">
                  <User size={20} />
                  {currentUser && (
                    <span className="text-[10px] font-bold uppercase tracking-wider hidden lg:inline max-w-[80px] truncate">
                      {currentUser.name.split(' ')[0]}
                    </span>
                  )}
                </button>
                <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-sm shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                  <div className="py-2">
                    {currentUser ? (
                      <>
                        <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/50">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Logged In As</p>
                          <p className="text-xs font-bold text-gray-900 truncate">{currentUser.name}</p>
                          <p className="text-[10px] text-gray-500 truncate">{currentUser.email}</p>
                        </div>
                        {(currentUser.role === 'admin' || isAdmin) && (
                          <Link to="/admin" className="block px-4 py-2 text-xs uppercase font-bold text-purple-900 hover:bg-purple-50">
                            Admin Portal
                          </Link>
                        )}
                        <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-xs uppercase font-bold text-red-600 hover:bg-gray-100">
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <Link to="/login" className="block px-4 py-2 text-xs uppercase font-bold text-gray-900 hover:bg-gray-100">
                          Sign In
                        </Link>
                        <Link to="/register" className="block px-4 py-2 text-xs uppercase font-bold text-gray-900 hover:bg-gray-100">
                          Create Account
                        </Link>
                        <div className="border-t border-gray-100 my-1"></div>
                        <Link to="/admin/login" className="block px-4 py-2 text-[10px] uppercase font-bold text-gray-400 hover:text-black hover:bg-gray-50">
                          Admin Portal Login
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Link to="/cart" aria-label="Cart" className="text-gray-900 p-2 hover:text-gray-600 transition-colors relative">
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold leading-none text-white bg-black rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Mega Menu Dropdown */}
        <AnimatePresence>
          {isMegaMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 w-full bg-white border-b border-gray-200 shadow-md overflow-hidden"
              onMouseEnter={() => setIsMegaMenuOpen(true)}
              onMouseLeave={() => setIsMegaMenuOpen(false)}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-4 gap-8">
                  <div className="col-span-2">
                    <h3 className="font-serif font-bold text-sm mb-4 uppercase tracking-widest text-gray-900 border-b pb-2 border-gray-100">Women's Categories</h3>
                    <ul className="grid grid-cols-2 gap-3 text-xs">
                      <li><Link to="/shop?category=women&subcategory=Dresses%20%26%20Evening%20Gowns" className="text-gray-600 hover:text-black transition-colors font-medium" onClick={() => setIsMegaMenuOpen(false)}>Dresses & Evening Gowns</Link></li>
                      <li><Link to="/shop?category=women&subcategory=Blouses%20%26%20Tops" className="text-gray-600 hover:text-black transition-colors font-medium" onClick={() => setIsMegaMenuOpen(false)}>Blouses & Tops</Link></li>
                      <li><Link to="/shop?category=women&subcategory=Tailored%20Trousers" className="text-gray-600 hover:text-black transition-colors font-medium" onClick={() => setIsMegaMenuOpen(false)}>Tailored Trousers</Link></li>
                      <li><Link to="/shop?category=women" className="text-gray-600 hover:text-black transition-colors font-medium" onClick={() => setIsMegaMenuOpen(false)}>All Women's Apparel</Link></li>
                    </ul>
                  </div>
                  <div className="col-span-2">
                    <div className="relative h-full w-full min-h-[180px] bg-gray-100 overflow-hidden group rounded-sm">
                      <img 
                        src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop" 
                        alt="The Calm Edit" 
                        className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-black/30" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        <span className="text-[10px] text-white/80 font-bold uppercase tracking-widest mb-1">Exclusive Collection</span>
                        <h3 className="text-white font-serif font-bold text-2xl uppercase tracking-widest mb-3">The Calm Edit</h3>
                        <Link 
                          to="/shop?collection=the-calm-edit" 
                          className="bg-white text-black px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors"
                          onClick={() => setIsMegaMenuOpen(false)}
                        >
                          Explore Lookbook
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-black text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            <div className="md:col-span-5 space-y-4">
              <Link to="/" className="text-2xl font-serif font-bold tracking-[0.25em] uppercase inline-block">
                ENNIGMA PARIS
              </Link>
              <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
                Custom Parisian high fashion & minimalist essentials. Designed with timeless precision for confidence and refined living.
              </p>
              
              {/* Newsletter Form */}
              <div className="pt-4">
                <span className="block text-xs font-bold uppercase tracking-widest mb-2 text-gray-300">Subscribe to Parisian Letters</span>
                <form onSubmit={handleNewsletterSubmit} className="flex max-w-md">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    required
                    className="flex-1 bg-white/10 border border-white/20 px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingNewsletter}
                    className="bg-white text-black px-5 py-2 text-xs font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Subscribe
                  </button>
                </form>
                {newsletterMsg && (
                  <p className="text-xs text-green-400 mt-2">{newsletterMsg}</p>
                )}
              </div>
            </div>
            
            <div className="md:col-span-3">
              <h4 className="text-xs font-bold tracking-widest uppercase mb-4 text-gray-200">Catalog</h4>
              <ul className="space-y-2.5 text-xs text-gray-400">
                <li><Link to="/shop" className="hover:text-white transition-colors">All Products</Link></li>
                <li><Link to="/shop?category=women" className="hover:text-white transition-colors">Women's Collection</Link></li>
                <li><Link to="/shop?collection=the-calm-edit" className="hover:text-white transition-colors">The Calm Edit</Link></li>
                <li><Link to="/wishlist" className="hover:text-white transition-colors">Wishlist</Link></li>
              </ul>
            </div>

            <div className="md:col-span-4">
              <h4 className="text-xs font-bold tracking-widest uppercase mb-4 text-gray-200">Boutique Headquarters</h4>
              <address className="not-italic text-xs text-gray-400 space-y-1.5 leading-relaxed">
                <p>2a De Fonseka Rd, Colombo 00500</p>
                <p>Paris Atelier: Rue Saint-Honoré, 75001 Paris</p>
                <p className="pt-2 font-mono text-gray-300">+94 76 864 5555</p>
                <p className="text-gray-500">Open daily 10:00 AM — 8:00 PM</p>
              </address>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-gray-900 text-xs text-gray-500 flex flex-col md:flex-row justify-between items-center">
            <p>&copy; {new Date().getFullYear()} ENNIGMA PARIS. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/shop" className="hover:text-gray-300">Privacy Policy</Link>
              <Link to="/shop" className="hover:text-gray-300">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
