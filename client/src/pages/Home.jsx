import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import { API_BASE_URL, resolveImageUrl } from '../config/api';

const defaultHeroFallback = {
  heroBadge: 'Spring / Summer Haute Couture',
  heroTitle: 'THE CALM EDIT',
  heroDescription: 'A destination for timeless Parisian elegance and confident luxury.',
  heroCoverImage: 'https://plus.unsplash.com/premium_photo-1664202526559-e21e9c0fb46a?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  heroButtonText: 'Shop The Collection',
  heroButtonLink: '/shop?collection=the-calm-edit',
  banners: [],
  showPromo: true,
  promoBadge: 'Editorial Feature',
  promoTitle: "L'Art de Vivre & Parisian Craftsmanship",
  promoDescription: 'Each silhouette is sculpted with timeless elegance, utilizing bespoke fabrics and fine artisanal tailoring.',
  promoImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop',
  promoButtonText: 'Discover Atelier',
  promoButtonLink: '/about',
};

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appearance, setAppearance] = useState(defaultHeroFallback);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, appRes] = await Promise.allSettled([
          axios.get(`${API_BASE_URL}/products`),
          axios.get(`${API_BASE_URL}/appearance`),
        ]);

        if (prodRes.status === 'fulfilled' && prodRes.value.data) {
          setFeaturedProducts(prodRes.value.data.slice(0, 4));
        }

        if (appRes.status === 'fulfilled' && appRes.value.data) {
          setAppearance({
            ...defaultHeroFallback,
            ...appRes.value.data,
          });
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching home data:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter active slides if configured
  const activeBanners = (appearance.banners || []).filter((b) => b.active !== false);

  // Auto-rotate hero slider if more than 1 banner exists
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % activeBanners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  // Current active slide or default hero
  const activeSlide = activeBanners.length > 0 ? activeBanners[currentSlideIndex] : null;

  const currentCoverImage = activeSlide
    ? resolveImageUrl(activeSlide.imageUrl)
    : resolveImageUrl(appearance.heroCoverImage || defaultHeroFallback.heroCoverImage);

  const currentBadge = activeSlide?.subtitle || appearance.heroBadge;
  const currentTitle = activeSlide?.title || appearance.heroTitle;
  const currentDesc = activeSlide?.description || appearance.heroDescription;
  const currentBtnText = activeSlide?.buttonText || appearance.heroButtonText || 'Shop The Collection';
  const currentBtnLink = activeSlide?.buttonLink || appearance.heroButtonLink || '/shop';

  const handlePrevSlide = (e) => {
    e.stopPropagation();
    setCurrentSlideIndex((prev) => (prev === 0 ? activeBanners.length - 1 : prev - 1));
  };

  const handleNextSlide = (e) => {
    e.stopPropagation();
    setCurrentSlideIndex((prev) => (prev + 1) % activeBanners.length);
  };

  return (
    <div className="w-full font-sans">
      {/* Hero Section with Admin-Controlled Cover Photo or Rotating Carousel */}
      <section className="relative h-[88vh] w-full bg-black overflow-hidden group">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlideIndex}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0.8 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 w-full h-full"
          >
            <img
              src={currentCoverImage}
              alt={currentTitle || 'Ennigma Paris Hero'}
              className="absolute inset-0 w-full h-full object-cover object-[center_35%] scale-105 transform transition-transform duration-10000 hover:scale-100"
            />
          </motion.div>
        </AnimatePresence>

        {/* Luxury Vignette & Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/45" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6 z-10">
          <motion.span
            key={`badge-${currentSlideIndex}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-[10px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.3em] font-bold text-gray-300 mb-2 sm:mb-3"
          >
            {currentBadge}
          </motion.span>

          <motion.h1
            key={`title-${currentSlideIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="text-3xl sm:text-5xl md:text-7xl font-serif tracking-[0.14em] sm:tracking-[0.2em] uppercase mb-4 sm:mb-6 font-bold text-white drop-shadow-md text-center max-w-full"
          >
            {currentTitle}
          </motion.h1>

          <motion.p
            key={`desc-${currentSlideIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-xs sm:text-base md:text-lg max-w-xl font-light mb-8 sm:mb-10 tracking-widest text-gray-200 px-4 text-center leading-relaxed"
          >
            {currentDesc}
          </motion.p>

          <motion.div
            key={`btn-${currentSlideIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
          >
            <Link
              to={currentBtnLink}
              className="inline-block bg-white text-black px-8 py-3.5 sm:px-10 sm:py-4 uppercase tracking-[0.18em] sm:tracking-[0.2em] text-[11px] sm:text-xs font-bold hover:bg-gray-100 transition-all shadow-xl hover:scale-105"
            >
              {currentBtnText}
            </Link>
          </motion.div>
        </div>

        {/* Carousel Slide Indicators & Arrows (shown when multiple slides are active) */}
        {activeBanners.length > 1 && (
          <>
            <button
              onClick={handlePrevSlide}
              aria-label="Previous Slide"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/40 text-white hover:bg-black/80 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNextSlide}
              aria-label="Next Slide"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/40 text-white hover:bg-black/80 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
            >
              <ChevronRight size={20} />
            </button>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
              {activeBanners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`h-1.5 transition-all rounded-full cursor-pointer ${
                    currentSlideIndex === idx ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Featured Collection Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs uppercase tracking-widest font-bold text-gray-400">Curated Selection</span>
          <h2 className="text-3xl font-serif tracking-wide uppercase text-gray-900 mt-1">New Arrivals</h2>
          <div className="w-12 h-0.5 bg-black mx-auto mt-4"></div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-gray-400">Loading new arrivals...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product._id || product.id} product={product} />
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
          <Link
            to="/shop"
            className="inline-block border border-black text-black px-10 py-4 uppercase tracking-widest text-xs font-bold hover:bg-black hover:text-white transition-colors"
          >
            View All Collections
          </Link>
        </div>
      </section>

      {/* Admin-Controlled Editorial Promo Banner */}
      {appearance.showPromo !== false && (
        <section className="relative w-full py-24 bg-black overflow-hidden my-12">
          <img
            src={resolveImageUrl(appearance.promoImage || defaultHeroFallback.promoImage)}
            alt={appearance.promoTitle || 'Editorial Atelier'}
            className="absolute inset-0 w-full h-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />

          <div className="relative max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 z-10">
            <div className="max-w-2xl text-white">
              <span className="text-xs uppercase tracking-[0.25em] font-bold text-gray-300 block mb-3">
                {appearance.promoBadge || 'Editorial Feature'}
              </span>
              <h2 className="text-3xl sm:text-5xl font-serif tracking-wider uppercase mb-6 leading-tight">
                {appearance.promoTitle || "L'Art de Vivre & Parisian Craftsmanship"}
              </h2>
              <p className="text-sm sm:text-base text-gray-200 font-light tracking-wide leading-relaxed mb-8">
                {appearance.promoDescription || 'Each silhouette is sculpted with timeless elegance, utilizing bespoke fabrics and fine artisanal tailoring.'}
              </p>
              <Link
                to={appearance.promoButtonLink || '/about'}
                className="inline-block border border-white text-white px-8 py-3.5 uppercase tracking-widest text-xs font-bold hover:bg-white hover:text-black transition-all"
              >
                {appearance.promoButtonText || 'Discover Atelier'}
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
