import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Skeleton';
import { Filter, X, Check } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001/api';

const Shop = () => {
  const [sortOption, setSortOption] = useState('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const categoryParam = searchParams.get('category') || '';
  const subcategoryParam = searchParams.get('subcategory') || '';
  const collectionParam = searchParams.get('collection') || '';
  const searchParam = searchParams.get('search') || '';

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', categoryParam, subcategoryParam, searchParam, sortOption, minPrice, maxPrice, selectedColor, selectedSize, inStockOnly],
    queryFn: async () => {
      let url = `${API_BASE_URL}/products?`;
      if (categoryParam) url += `category=${encodeURIComponent(categoryParam)}&`;
      if (subcategoryParam) url += `subcategory=${encodeURIComponent(subcategoryParam)}&`;
      if (searchParam) url += `search=${encodeURIComponent(searchParam)}&`;
      if (sortOption) url += `sort=${encodeURIComponent(sortOption)}&`;
      if (minPrice) url += `minPrice=${minPrice}&`;
      if (maxPrice) url += `maxPrice=${maxPrice}&`;
      if (selectedColor) url += `color=${encodeURIComponent(selectedColor)}&`;
      if (selectedSize) url += `size=${encodeURIComponent(selectedSize)}&`;
      if (inStockOnly) url += `inStock=true&`;

      const { data } = await axios.get(url);
      
      let filtered = data;
      if (collectionParam) {
        filtered = filtered.filter(p => 
          p.collectionName?.toLowerCase().includes(collectionParam.toLowerCase()) || 
          p.isFeatured
        );
      }
      return filtered;
    },
  });

  const subcategoriesList = [
    { label: 'All Pieces', value: '' },
    { label: 'Dresses & Evening Gowns', value: 'Dresses & Evening Gowns' },
    { label: 'Blouses & Tops', value: 'Blouses & Tops' },
    { label: 'Tailored Trousers', value: 'Tailored Trousers' },
    { label: 'The Calm Edit', value: 'The Calm Edit' },
  ];

  const availableColors = ['Black', 'White', 'Beige', 'Navy', 'Emerald', 'Gold', 'Burgundy'];
  const availableSizes = ['XS', 'S', 'M', 'L', 'XL'];

  const handleSubcategoryClick = (subValue) => {
    if (!subValue) {
      navigate('/shop');
    } else {
      navigate(`/shop?subcategory=${encodeURIComponent(subValue)}`);
    }
  };

  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSelectedColor('');
    setSelectedSize('');
    setInStockOnly(false);
    navigate('/shop');
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
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-1.5 border border-gray-300 px-3 py-2 rounded-sm hover:border-black transition-all cursor-pointer font-bold uppercase tracking-wider text-[11px]"
          >
            <Filter size={14} />
            <span>{showFilters ? 'Hide Filters' : 'Filter & Refine'}</span>
          </button>
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
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expanded Multi-Facet Filter Drawer */}
      {showFilters && (
        <div className="bg-neutral-50 p-6 rounded-sm mb-8 border border-neutral-200 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-neutral-200">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900">Refine Selection</h3>
            <button onClick={clearFilters} className="text-xs text-gray-500 underline hover:text-black">
              Reset Filters
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Price Filter */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-2">Price Range (LKR)</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full border border-gray-300 p-2 text-xs rounded-sm focus:border-black outline-none"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full border border-gray-300 p-2 text-xs rounded-sm focus:border-black outline-none"
                />
              </div>
            </div>

            {/* Color Swatches */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-2">Color</label>
              <div className="flex flex-wrap gap-1.5">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(selectedColor === color ? '' : color)}
                    className={`px-2.5 py-1 text-[11px] border rounded-sm transition-all cursor-pointer ${
                      selectedColor === color
                        ? 'bg-black text-white border-black font-bold'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Filter */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-2">Size</label>
              <div className="flex flex-wrap gap-1.5">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(selectedSize === size ? '' : size)}
                    className={`w-8 h-8 flex items-center justify-center text-[11px] border rounded-sm transition-all cursor-pointer ${
                      selectedSize === size
                        ? 'bg-black text-white border-black font-bold'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Stock Filter */}
            <div className="flex items-center">
              <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold uppercase tracking-wider text-gray-800">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 accent-black rounded-sm"
                />
                <span>In-Stock Pieces Only</span>
              </label>
            </div>
          </div>
        </div>
      )}

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

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <ProductCardSkeleton key={n} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-24 text-center bg-gray-50 rounded-sm">
          <h2 className="text-lg font-serif text-gray-900 mb-2">No pieces found matching your criteria</h2>
          <p className="text-xs text-gray-500 mb-6">Try clearing your filters or refining your search parameters.</p>
          <button
            onClick={clearFilters}
            className="bg-black text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer"
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

