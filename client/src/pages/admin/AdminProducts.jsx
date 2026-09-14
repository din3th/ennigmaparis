import { useState, useEffect } from 'react';
import axios from 'axios';

import { API_BASE_URL } from '../../config/api';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockEdits, setStockEdits] = useState({});
  const [savingId, setSavingId] = useState(null);

  // New Product Form state
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [category, setCategory] = useState('Women');
  const [subcategory, setSubcategory] = useState('Dresses & Evening Gowns');
  const [sizes, setSizes] = useState('UK 6, UK 8, UK 10, UK 12');
  const [stock, setStock] = useState(15);
  const [uploading, setUploading] = useState(false);
  const [isAddingOpen, setIsAddingOpen] = useState(false);

  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE_URL}/products`);
      setProducts(data);

      // Initialize stock edits map
      const initialEdits = {};
      data.forEach((p) => {
        initialEdits[p._id] = p.stock !== undefined ? p.stock : 10;
      });
      setStockEdits(initialEdits);

      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleStockChange = (productId, newStock) => {
    const value = Math.max(0, parseInt(newStock) || 0);
    setStockEdits((prev) => ({ ...prev, [productId]: value }));
  };

  const saveStockLevel = async (product) => {
    const newStock = stockEdits[product._id];
    setSavingId(product._id);
    try {
      await axios.put(
        `${API_BASE_URL}/products/${product._id}`,
        { stock: newStock },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local product list
      setProducts(products.map(p => p._id === product._id ? { ...p, stock: newStock } : p));
      alert(`Stock updated to ${newStock} units for "${product.name}"`);
    } catch (error) {
      console.error(error);
      alert('Failed to update stock level');
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}" from catalog?`)) return;
    try {
      await axios.delete(`${API_BASE_URL}/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(products.filter((p) => p._id !== productId));
    } catch (error) {
      alert('Failed to delete product');
    }
  };

  const uploadFileHandler = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    setUploading(true);

    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      const { data } = await axios.post(`${API_BASE_URL}/upload`, formData, config);
      const newUploaded = data.images || [data.image];
      setImages((prev) => [...prev, ...newUploaded]);
      setUploading(false);
    } catch (error) {
      console.error(error);
      setUploading(false);
      alert('Failed to upload image(s)');
    }
  };

  const handleAddImageUrl = (e) => {
    e.preventDefault();
    if (!imageUrlInput) return;
    setImages((prev) => [...prev, imageUrlInput]);
    setImageUrlInput('');
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const finalImages = images.length > 0 
        ? images 
        : ['https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800'];

      await axios.post(
        `${API_BASE_URL}/products`,
        {
          name,
          slug: name.toLowerCase().replace(/ /g, '-'),
          price: Number(price),
          description,
          images: finalImages,
          category,
          subcategory,
          sizes: sizes.split(',').map((s) => s.trim()),
          stock: Number(stock),
          brand: 'ENNIGMA PARIS',
          isFeatured: true,
          isNewArrival: true,
          collectionName: 'The Calm Edit',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setName(''); setPrice(''); setDescription(''); setImages([]); setCategory('Women'); setSubcategory('Dresses & Evening Gowns'); setStock(15);
      setIsAddingOpen(false);
      fetchProducts();
      alert('Product created successfully with multiple images!');
    } catch (error) {
      console.error('Failed to add product:', error);
      alert(error.response?.data?.message || 'Failed to add product');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = !selectedCategory || p.category?.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCat;
  });

  return (
    <div className="py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-8 border-b border-gray-200 gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-gray-400 font-bold">Catalog Management</span>
          <h1 className="text-2xl font-serif tracking-tight text-gray-900 mt-1">Inventory & Stock Level Center</h1>
        </div>
        <button
          onClick={() => setIsAddingOpen(!isAddingOpen)}
          className="bg-black text-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors shadow-sm cursor-pointer"
        >
          {isAddingOpen ? 'Cancel' : '+ Add New Product'}
        </button>
      </div>

      {/* Add New Product Drawer / Form */}
      {isAddingOpen && (
        <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-md mb-8">
          <h2 className="text-xs font-bold tracking-widest uppercase text-gray-900 mb-6 pb-2 border-b border-gray-100">
            Create Catalog Piece (Multiple Images Supported)
          </h2>
          <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Product Title *</label>
              <input 
                className="w-full border border-gray-200 p-2.5 text-xs focus:border-black focus:outline-none" 
                placeholder="e.g. MANGO Black Mini Dress" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Price (LKR) *</label>
              <input 
                className="w-full border border-gray-200 p-2.5 text-xs focus:border-black focus:outline-none" 
                type="number" 
                placeholder="e.g. 4380" 
                value={price} 
                onChange={(e) => setPrice(e.target.value)} 
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
              <select 
                className="w-full border border-gray-200 p-2.5 text-xs focus:border-black focus:outline-none bg-white font-medium" 
                value={category} 
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (e.target.value === 'Women') setSubcategory('Dresses & Evening Gowns');
                  if (e.target.value === 'Accessories') setSubcategory('Handbags');
                }} 
                required 
              >
                <option value="Women">Women</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Subcategory *</label>
              <select 
                className="w-full border border-gray-200 p-2.5 text-xs focus:border-black focus:outline-none bg-white font-medium" 
                value={subcategory} 
                onChange={(e) => setSubcategory(e.target.value)} 
                required 
              >
                {category === 'Women' && (
                  <>
                    <option value="Dresses & Evening Gowns">Dresses & Evening Gowns</option>
                    <option value="Blouses & Tops">Blouses & Tops</option>
                    <option value="Tailored Trousers">Tailored Trousers</option>
                    <option value="The Calm Edit">The Calm Edit</option>
                  </>
                )}
                {category === 'Accessories' && (
                  <>
                    <option value="Handbags">Handbags</option>
                    <option value="Footwear">Footwear</option>
                    <option value="Jewelry">Jewelry</option>
                    <option value="Perfume">Perfume</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Initial Stock Count *</label>
              <input 
                className="w-full border border-gray-200 p-2.5 text-xs focus:border-black focus:outline-none" 
                type="number" 
                value={stock} 
                onChange={(e) => setStock(Number(e.target.value))} 
                required 
              />
            </div>

            {/* Multiple Product Images Upload */}
            <div className="sm:col-span-2 space-y-2">
              <label className="block text-xs font-medium text-gray-700">Product Gallery Images (Select Multiple Files)</label>
              <div className="flex gap-2">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="w-full border border-gray-200 p-2 text-xs" 
                  onChange={uploadFileHandler} 
                />
              </div>

              {/* Add image URL manually */}
              <div className="flex gap-2 pt-1">
                <input
                  type="url"
                  placeholder="Or paste image URL (http://...)"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="flex-1 border border-gray-200 p-2 text-xs focus:border-black focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="bg-gray-800 text-white px-3 py-2 text-xs uppercase font-bold tracking-wider"
                >
                  Add URL
                </button>
              </div>

              {uploading && <p className="text-[11px] text-gray-400">Uploading image files...</p>}

              {/* Gallery Image Previews */}
              {images.length > 0 && (
                <div className="pt-2">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                    {images.length} Image(s) Attached (First image is main thumbnail):
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative group w-16 h-20 bg-gray-100 border border-gray-200 rounded-sm overflow-hidden">
                        <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold shadow-md hover:bg-red-700"
                          title="Remove image"
                        >
                          ×
                        </button>
                        {idx === 0 && (
                          <span className="absolute bottom-0 inset-x-0 bg-black/75 text-white text-[8px] text-center font-bold uppercase py-0.5">
                            Main
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
              <textarea 
                className="w-full border border-gray-200 p-2.5 text-xs focus:border-black focus:outline-none" 
                rows="3" 
                placeholder="Describe fabric, craftsmanship, and silhouette details..." 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                required 
              />
            </div>
            <button 
              type="submit" 
              disabled={uploading} 
              className="sm:col-span-2 bg-black text-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
            >
              Publish Product with {images.length || 1} Image(s)
            </button>
          </form>
        </div>
      )}


      {/* Product Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-white p-4 border border-gray-100 rounded-sm shadow-sm">
        <input
          type="text"
          placeholder="Search by product name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-72 border border-gray-200 p-2.5 text-xs focus:border-black focus:outline-none"
        />

        <div className="flex items-center space-x-2 text-xs font-medium text-gray-500">
          <span>Total: {filteredProducts.length} Items</span>
        </div>
      </div>

      {/* Main Stock Table */}
      {loading ? (
        <div className="py-12 text-center text-sm font-sans text-gray-500">Loading catalog inventory...</div>
      ) : (
        <div className="bg-white border border-gray-100 p-6 rounded-sm shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-[10px] uppercase font-bold tracking-widest text-gray-400">
                  <th className="py-3 px-4">Product Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price (LKR)</th>
                  <th className="py-3 px-4">Stock Status</th>
                  <th className="py-3 px-4">Stock Count Adjustment</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-sans">
                {filteredProducts.map((p) => {
                  const currentStock = stockEdits[p._id] !== undefined ? stockEdits[p._id] : p.stock;
                  const isLow = currentStock > 0 && currentStock <= 5;
                  const isOut = currentStock === 0;

                  return (
                    <tr key={p._id} className="hover:bg-gray-50/50">
                      {/* Product details */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <img 
                            src={p.images && p.images[0] ? p.images[0] : '/placeholder.jpg'} 
                            alt={p.name} 
                            className="w-12 h-14 object-cover border border-gray-200 rounded-sm bg-gray-50" 
                          />
                          <div>
                            <span className="font-bold text-gray-900 uppercase font-heading text-xs block">{p.name}</span>
                            <span className="text-[10px] text-gray-400 font-mono">ID: {p._id.substring(18)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-gray-600 font-medium">
                        {p.category}
                      </td>

                      {/* Price in LKR */}
                      <td className="py-3 px-4 font-bold text-gray-900">
                        LKR {p.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Stock Status Badge */}
                      <td className="py-3 px-4">
                        {isOut ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                            Low Stock ({currentStock})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700">
                            In Stock ({currentStock})
                          </span>
                        )}
                      </td>

                      {/* Interactive Stock Level Controls */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleStockChange(p._id, currentStock - 1)}
                            className="w-7 h-7 border border-gray-300 rounded text-sm font-bold flex items-center justify-center hover:bg-gray-100 cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={currentStock}
                            onChange={(e) => handleStockChange(p._id, e.target.value)}
                            className="w-16 border border-gray-300 p-1 text-center text-xs font-bold rounded focus:border-black focus:outline-none font-mono"
                          />
                          <button
                            onClick={() => handleStockChange(p._id, currentStock + 1)}
                            className="w-7 h-7 border border-gray-300 rounded text-sm font-bold flex items-center justify-center hover:bg-gray-100 cursor-pointer"
                          >
                            +
                          </button>
                          <button
                            onClick={() => saveStockLevel(p)}
                            disabled={savingId === p._id}
                            className="ml-2 bg-black text-white px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider hover:bg-gray-800 disabled:opacity-50 transition-colors cursor-pointer rounded-sm"
                          >
                            {savingId === p._id ? '...' : 'Save'}
                          </button>
                        </div>
                      </td>

                      {/* Delete action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteProduct(p._id, p.name)}
                          className="text-red-600 hover:text-red-800 text-[11px] font-bold uppercase tracking-wider cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-400 font-sans">No products matching criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
