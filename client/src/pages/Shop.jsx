import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';

const API_BASE_URL = 'http://localhost:3001/api';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState('newest');
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const categoryParam = searchParams.get('category');
  const subcategoryParam = searchParams.get('subcategory');
  const collectionParam = searchParams.get('collection');
  const searchParam = searchParams.get('search');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let url = `${API_BASE_URL}/products?`;
        if (categoryParam) url += `category=${encodeURIComponent(categoryParam)}&`;
        if (subcategoryParam) url += `subcategory=${encodeURIComponent(subcategoryParam)}&`;
        if (searchParam) url += `search=${encodeURIComponent(searchParam)}&`;
        if (sortOption) url += `sort=${encodeURIComponent(sortOption)}&`;

        const { data } = await axios.get(url);
        
        let filtered = data;
        if (collectionParam) {
          filtered = filtered.filter(p => 
            p.collectionName?.toLowerCase().includes(collectionParam.toLowerCase()) || 
            p.isFeatured
          );
        }

        setProducts(filtered);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error);
        setLoading(false);
      }
    };
    fetchProducts();
  }, [categoryParam, subcategoryParam, collectionParam, searchParam, sortOption]);

  const subcategoriesList = [
    { label: 'All Pieces', value: '' },
    { label: 'Dresses & Evening Gowns', value: 'Dresses & Evening Gowns' },
    { label: 'Blouses & Tops', value: 'Blouses & Tops' },
    { label: 'Tailored Trousers', value: 'Tailored Trousers' },
    { label: 'The Calm Edit', value: 'The Calm Edit' },
  ];

  const handleSubcategoryClick = (subValue) => {
    if (!subValue) {
      navigate('/shop');
    } else {
      navigate(`/shop?subcategory=${encodeURIComponent(subValue)}`);
    }
  };

  const pageTitle = collectionParam 
    ? collectionParam.replaceAll('-', ' ').toUpperCase()
    : subcategoryParam
    ? `${categoryParam || ''} / ${subcategoryParam}`.toUpperCase()
    : categoryParam 
    ? categoryParam.toUpperCase() 
    : 'ALL COLLECTIONS';

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-b border-gray-200 pb-6 mb-6 gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Parisian Fashion Catalog</span>
          <h1 className="text-3xl font-serif tracking-tight text-gray-900 mt-0.5">{pageTitle}</h1>
        </div>

        <div className="flex items-center space-x-4 text-xs font-medium text-gray-700">
          <span>{products.length} Products</span>
          <span className="text-gray-300">|</span>
          <div className="flex items-center space-x-2">
            <label className="text-gray-500">Sort By:</label>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="border border-gray-200 p-2 text-xs bg-white rounded-sm focus:outline-none focus:border-black font-medium"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Customer Rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subcategory Pill Filter Tags */}
      <div className="flex flex-wrap gap-2 mb-10 pb-4 border-b border-gray-100">
        {subcategoriesList.map((sub) => {
          const isActive = (subcategoryParam || '') === sub.value;
          return (
            <button
              key={sub.label}
              onClick={() => handleSubcategoryClick(sub.value)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-sm cursor-pointer border ${
                isActive
                  ? 'bg-black text-white border-black shadow-sm'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-black hover:bg-white'
              }`}
            >
              {sub.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-24 text-center text-sm font-sans text-gray-500">Fetching curated pieces...</div>
      ) : products.length === 0 ? (
        <div className="py-24 text-center bg-gray-50 rounded-sm">
          <h2 className="text-lg font-serif text-gray-900 mb-2">No pieces found matching your criteria</h2>
          <p className="text-xs text-gray-500 mb-6">Try clearing your category or subcategory filters.</p>
          <button
            onClick={() => navigate('/shop')}
            className="bg-black text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
          {products.map((product) => (
            <ProductCard key={product._id || product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Shop;
