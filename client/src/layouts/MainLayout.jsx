import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, Menu, User, ChevronDown, Heart, X, ArrowRight, Package, UserCheck } from 'lucide-react';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearchOpen(false);
    navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery('');
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
    } catch {
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
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="text-gray-900 p-2 cursor-pointer hover:text-gray-600 transition-colors"
                aria-label="Open mobile navigation"
              >
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
              <Link to="/about" className="text-xs font-bold tracking-widest uppercase text-gray-500 hover:text-gray-900 transition-colors">
                ATELIER
              </Link>
            </nav>

            {/* Logo */}
            <div className="flex-shrink-0 flex items-center justify-center absolute left-1/2 transform -translate-x-1/2">
              <Link to="/" className="text-2xl font-serif font-bold tracking-[0.25em] uppercase text-gray-900">
                ENNIGMA
              </Link>
            </div>

            {/* Icons */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Search Toggle Icon */}
              <button
                onClick={() => setIsSearchOpen(true)}
                aria-label="Search Catalog"
                className="text-gray-900 p-2 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <Search size={20} />
              </button>

              {/* Wishlist */}
              <Link to="/wishlist" aria-label="Wishlist" className="text-gray-900 p-2 hover:text-gray-600 transition-colors relative">
                <Heart size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold leading-none text-white bg-red-600 rounded-full">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              
              {/* User Dropdown */}
              <div className="relative group">
                <button className="text-gray-900 p-2 hover:text-gray-600 transition-colors flex items-center gap-1 cursor-pointer">
                  <User size={20} />
                  {currentUser && (
                    <span className="text-[10px] font-bold uppercase tracking-wider hidden lg:inline max-w-[80px] truncate">
                      {currentUser.name.split(' ')[0]}
                    </span>
                  )}
                </button>
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-sm shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                  <div className="py-2">
                    {currentUser ? (
                      <>
                        <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/50">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Logged In As</p>
                          <p className="text-xs font-bold text-gray-900 truncate">{currentUser.name}</p>
                          <p className="text-[10px] text-gray-500 truncate">{currentUser.email}</p>
                        </div>
                        <Link to="/orders" className="flex items-center gap-2 px-4 py-2 text-xs uppercase font-bold text-gray-800 hover:bg-gray-100">
                          <Package size={14} /> My Orders & Invoices
                        </Link>
                        <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-xs uppercase font-bold text-gray-800 hover:bg-gray-100">
                          <UserCheck size={14} /> Account Profile
                        </Link>
                        <Link to="/wishlist" className="flex items-center gap-2 px-4 py-2 text-xs uppercase font-bold text-gray-800 hover:bg-gray-100">
                          <Heart size={14} /> Saved Wishlist
                        </Link>
                        {(currentUser.role === 'admin' || isAdmin) && (
                          <Link to="/admin" className="block px-4 py-2 text-xs uppercase font-bold text-purple-900 hover:bg-purple-50 border-t border-gray-100">
                            Admin Portal
                          </Link>
                        )}
                        <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-xs uppercase font-bold text-red-600 hover:bg-gray-100 border-t border-gray-100">
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
                        <Link to="/orders" className="block px-4 py-2 text-xs uppercase font-bold text-gray-500 hover:bg-gray-100">
                          Order Lookup
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

              {/* Shopping Bag */}
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

        {/* Search Drawer Overlay */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute top-0 left-0 w-full bg-white border-b border-gray-200 shadow-xl z-50 p-6 sm:p-8"
            >
              <div className="max-w-4xl mx-auto relative">
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="absolute -top-2 right-0 p-2 text-gray-400 hover:text-black"
                  aria-label="Close search"
                >
                  <X size={22} />
                </button>

                <form onSubmit={handleSearchSubmit} className="mt-4">
                  <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-gray-400 block mb-2">
                    Search The Parisian Catalog
                  </span>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Search dresses, silk blouses, trousers, or collections..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full border-b-2 border-black py-4 pr-12 text-base sm:text-xl font-serif text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
                    />
                    <button
                      type="submit"
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-black hover:text-gray-600"
                    >
                      <ArrowRight size={22} />
                    </button>
                  </div>
                </form>

                {/* Popular Search Suggestions */}
                <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-gray-400 uppercase tracking-wider font-bold text-[10px]">Trending:</span>
                  {['Dresses & Evening Gowns', 'Blouses & Tops', 'Tailored Trousers', 'The Calm Edit', 'Black', 'Emerald'].map((term) => (
                    <button
                      key={term}
                      onClick={() => {
                        setIsSearchOpen(false);
                        navigate(`/shop?search=${encodeURIComponent(term)}`);
                      }}
                      className="bg-gray-100 hover:bg-black hover:text-white px-3 py-1 text-xs text-gray-700 transition-colors cursor-pointer rounded-sm"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Slide-Out Drawer Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              />

              {/* Drawer Sheet */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
                className="relative w-4/5 max-w-sm h-full bg-white shadow-2xl p-6 flex flex-col justify-between overflow-y-auto"
              >
                <div>
                  <div className="flex items-center justify-between pb-6 border-b border-gray-100">
                    <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-serif font-bold tracking-[0.2em] uppercase text-gray-900">
                      ENNIGMA
                    </Link>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="p-1 text-gray-500 hover:text-black"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <nav className="mt-6 space-y-4 text-xs font-bold uppercase tracking-widest">
                    <Link
                      to="/shop"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block py-2 text-gray-900 hover:text-gray-500 border-b border-gray-50"
                    >
                      All Collections
                    </Link>
                    <Link
                      to="/shop?category=women"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block py-2 text-gray-900 hover:text-gray-500 border-b border-gray-50"
                    >
                      Women's Apparel
                    </Link>
                    <Link
                      to="/shop?collection=the-calm-edit"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block py-2 text-gray-900 hover:text-gray-500 border-b border-gray-50"
                    >
                      The Calm Edit
                    </Link>
                    <Link
                      to="/about"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block py-2 text-gray-900 hover:text-gray-500 border-b border-gray-50"
                    >
                      Atelier Heritage
                    </Link>
                    <Link
                      to="/shipping-returns"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block py-2 text-gray-900 hover:text-gray-500 border-b border-gray-50"
                    >
                      Shipping & Returns
                    </Link>
                    <Link
                      to="/wishlist"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between py-2 text-gray-900 hover:text-gray-500 border-b border-gray-50"
                    >
                      <span>Wishlist</span>
                      {wishlistCount > 0 && (
                        <span className="bg-red-600 text-white text-[9px] px-2 py-0.5 rounded-full">{wishlistCount}</span>
                      )}
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block py-2 text-gray-900 hover:text-gray-500 border-b border-gray-50"
                    >
                      My Orders & Invoices
                    </Link>
                    {currentUser && (
                      <Link
                        to="/profile"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block py-2 text-gray-900 hover:text-gray-500 border-b border-gray-50"
                      >
                        Account Profile
                      </Link>
                    )}
                  </nav>
                </div>

                <div className="pt-6 border-t border-gray-100">
                  {currentUser ? (
                    <div className="space-y-3">
                      <p className="text-[11px] text-gray-500">Signed in as <strong className="text-black">{currentUser.name}</strong></p>
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full bg-red-600 text-white py-2 text-xs uppercase font-bold tracking-wider rounded-sm"
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Link
                        to="/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block w-full text-center bg-black text-white py-2.5 text-xs uppercase font-bold tracking-wider rounded-sm"
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block w-full text-center border border-gray-300 py-2.5 text-xs uppercase font-bold tracking-wider rounded-sm"
                      >
                        Create Account
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
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
              <p className="text-xs text-gray-400 leading-relaxed max-w-sm font-sans">
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
                    className="flex-1 bg-white/10 border border-white/20 px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white font-sans"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingNewsletter}
                    className="bg-white text-black px-5 py-2 text-xs font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
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
              <h4 className="text-xs font-bold tracking-widest uppercase mb-4 text-gray-200">Catalog & Atelier</h4>
              <ul className="space-y-2.5 text-xs text-gray-400">
                <li><Link to="/shop" className="hover:text-white transition-colors">All Products</Link></li>
                <li><Link to="/shop?category=women" className="hover:text-white transition-colors">Women's Collection</Link></li>
                <li><Link to="/shop?collection=the-calm-edit" className="hover:text-white transition-colors">The Calm Edit</Link></li>
                <li><Link to="/wishlist" className="hover:text-white transition-colors">Wishlist</Link></li>
                <li><Link to="/about" className="hover:text-white transition-colors">Atelier Heritage</Link></li>
                <li><Link to="/shipping-returns" className="hover:text-white transition-colors">Shipping & Exchanges</Link></li>
              </ul>
            </div>

            <div className="md:col-span-4">
              <h4 className="text-xs font-bold tracking-widest uppercase mb-4 text-gray-200">Flagship Boutique</h4>
              <address className="not-italic text-xs text-gray-400 space-y-1.5 leading-relaxed font-sans">
                <p>2a De Fonseka Rd, Colombo 00500</p>
                <p>Western Province, Sri Lanka</p>
                <p className="pt-2 font-mono text-gray-300">+94 76 864 5555</p>
                <p className="text-gray-500">Open daily 10:00 AM — 8:00 PM</p>
              </address>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-gray-900 text-xs text-gray-500 flex flex-col md:flex-row justify-between items-center font-sans">
            <p>&copy; {new Date().getFullYear()} ENNIGMA PARIS. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-gray-300 transition-colors">Terms of Service</Link>
              <Link to="/shipping-returns" className="hover:text-gray-300 transition-colors">Shipping & Returns</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
