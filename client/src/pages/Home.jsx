import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import { API_BASE_URL } from '../config/api';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeProducts = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/products`);
        setFeaturedProducts(data.slice(0, 4));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching home products:', error);
        setLoading(false);
      }
    };
    fetchHomeProducts();
  }, []);

  // Ultra 4K High Resolution Editorial Fashion Hero Image
  const heroImageUrl = "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=3840&auto=format&fit=crop";

  return (
    <div className="w-full font-sans">
      {/* Hero Section with Pristine High-Res Widescreen Editorial Banner */}
      <section className="relative h-[88vh] w-full bg-black overflow-hidden">
        <img 
          src={heroImageUrl} 
          alt="Ennigma Paris Hero Collection" 
          className="absolute inset-0 w-full h-full object-cover object-[center_35%] scale-105 transform transition-transform duration-10000 hover:scale-100"
        />
        {/* Luxury Vignette & Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/40" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6 z-10">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-xs uppercase tracking-[0.3em] font-bold text-gray-300 mb-3"
          >
            Spring / Summer Haute Couture
          </motion.span>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-7xl font-serif tracking-[0.2em] uppercase mb-6 font-bold text-white drop-shadow-md"
          >
            THE CALM EDIT
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-sm md:text-lg max-w-xl font-light mb-10 tracking-widest text-gray-200"
          >
            A destination for timeless Parisian elegance and confident luxury.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link 
              to="/shop?collection=the-calm-edit" 
              className="inline-block bg-white text-black px-10 py-4 uppercase tracking-[0.2em] text-xs font-bold hover:bg-gray-100 transition-all shadow-xl hover:scale-105"
            >
              Shop The Collection
            </Link>
          </motion.div>
        </div>
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
    </div>
  );
};

export default Home;
