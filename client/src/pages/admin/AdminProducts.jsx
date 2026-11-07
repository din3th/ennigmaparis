import { useState, useEffect } from 'react';
import axios from 'axios';

import { API_BASE_URL, resolveImageUrl } from '../../config/api';
import AddProductForm from './products/AddProductForm';
import EditProductModal from './products/EditProductModal';


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
  const [selectedSizes, setSelectedSizes] = useState(['UK 6', 'UK 8', 'UK 10', 'UK 12']);
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [stock, setStock] = useState(15);
  const [uploading, setUploading] = useState(false);
  const [isAddingOpen, setIsAddingOpen] = useState(false);

  // Edit Product Modal state
  const [editingProduct, setEditingProduct] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    price: '',
    salePrice: '',
    description: '',
    images: [],
    category: 'Women',
    subcategory: 'Dresses & Evening Gowns',
    sizes: ['UK 6', 'UK 8', 'UK 10', 'UK 12'],
    stock: 10,
    isFeatured: true,
  });
  const [editCustomSizeInput, setEditCustomSizeInput] = useState('');
  const [editImageUrlInput, setEditImageUrlInput] = useState('');
  const [updatingProduct, setUpdatingProduct] = useState(false);
  const [editUploading, setEditUploading] = useState(false);


  const toggleAddSize = (sz) => {
    setSelectedSizes((prev) =>
      prev.includes(sz) ? prev.filter((s) => s !== sz) : [...prev, sz]
    );
  };

  const handleAddCustomSize = (e) => {
    e.preventDefault();
    if (!customSizeInput.trim()) return;
    const clean = customSizeInput.trim();
    if (!selectedSizes.includes(clean)) {
      setSelectedSizes([...selectedSizes, clean]);
    }
    setCustomSizeInput('');
  };

  const toggleEditSize = (sz) => {
    setEditFormData((prev) => {
      const current = Array.isArray(prev.sizes) ? prev.sizes : [];
      const updated = current.includes(sz)
        ? current.filter((s) => s !== sz)
        : [...current, sz];
      return { ...prev, sizes: updated };
    });
  };

  const handleAddEditCustomSize = (e) => {
    e.preventDefault();
    if (!editCustomSizeInput.trim()) return;
    const clean = editCustomSizeInput.trim();
    setEditFormData((prev) => {
      const current = Array.isArray(prev.sizes) ? prev.sizes : [];
      if (!current.includes(clean)) {
        return { ...prev, sizes: [...current, clean] };
      }
      return prev;
    });
    setEditCustomSizeInput('');
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    const productSizes = Array.isArray(p.sizes) && p.sizes.length > 0
      ? p.sizes
      : (typeof p.sizes === 'string' && p.sizes.trim()
          ? p.sizes.split(',').map((s) => s.trim()).filter(Boolean)
          : ['UK 6', 'UK 8', 'UK 10', 'UK 12']);

    setEditFormData({
      name: p.name || '',
      price: p.price || '',
      salePrice: p.salePrice || '',
      description: p.description || '',
      images: p.images || [],
      category: p.category || 'Women',
      subcategory: p.subcategory || 'Dresses & Evening Gowns',
      sizes: productSizes,
      stock: p.stock !== undefined ? p.stock : 10,
      isFeatured: !!p.isFeatured,
    });
  };

  const handleSaveEditProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    setUpdatingProduct(true);
    try {
      await axios.put(
        `${API_BASE_URL}/products/${editingProduct._id}`,
        {
          ...editFormData,
          price: Number(editFormData.price),
          salePrice: editFormData.salePrice ? Number(editFormData.salePrice) : null,
          stock: Number(editFormData.stock),
          sizes: Array.isArray(editFormData.sizes)
            ? editFormData.sizes
            : (typeof editFormData.sizes === 'string'
                ? editFormData.sizes.split(',').map((s) => s.trim()).filter(Boolean)
                : []),
        }
      );
      alert('Product details updated successfully!');
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      console.error('Failed to update product:', err);
      alert(err.response?.data?.message || 'Failed to update product');
    } finally {
      setUpdatingProduct(false);
    }
  };

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
        { stock: newStock }
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
      await axios.delete(`${API_BASE_URL}/products/${productId}`);
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
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          },
      };
      const { data } = await axios.post(`${API_BASE_URL}/upload`, formData, config);
      const newUploaded = data.images || (data.image ? [data.image] : []);
      setImages((prev) => [...prev, ...newUploaded]);
      setUploading(false);
    } catch (error) {
      console.error('Image upload failed:', error.response?.data || error);
      setUploading(false);
      const msg = error.response?.data?.message || 'Failed to upload image(s)';
      alert(msg);
    }
  };

  const uploadEditFileHandler = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    setEditUploading(true);

    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          },
      };
      const { data } = await axios.post(`${API_BASE_URL}/upload`, formData, config);
      const newUploaded = data.images || (data.image ? [data.image] : []);
      setEditFormData((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...newUploaded],
      }));
      setEditUploading(false);
    } catch (error) {
      console.error('Edit image upload failed:', error.response?.data || error);
      setEditUploading(false);
      const msg = error.response?.data?.message || 'Failed to upload image(s)';
      alert(msg);
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
          sizes: selectedSizes.length > 0 ? selectedSizes : ['One Size'],
          stock: Number(stock),
          brand: 'ENNIGMA PARIS',
          isFeatured: true,
          isNewArrival: true,
          collectionName: 'The Calm Edit',
        }
      );

      setName(''); setPrice(''); setDescription(''); setImages([]); setCategory('Women'); setSubcategory('Dresses & Evening Gowns'); setStock(15);
      setSelectedSizes(['UK 6', 'UK 8', 'UK 10', 'UK 12']);
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
        <AddProductForm category={category} customSizeInput={customSizeInput} description={description} handleAddCustomSize={handleAddCustomSize} handleAddImageUrl={handleAddImageUrl} handleAddProduct={handleAddProduct} handleRemoveImage={handleRemoveImage} imageUrlInput={imageUrlInput} images={images} name={name} price={price} selectedSizes={selectedSizes} setCategory={setCategory} setCustomSizeInput={setCustomSizeInput} setDescription={setDescription} setImageUrlInput={setImageUrlInput} setName={setName} setPrice={setPrice} setSelectedSizes={setSelectedSizes} setStock={setStock} setSubcategory={setSubcategory} stock={stock} subcategory={subcategory} toggleAddSize={toggleAddSize} uploadFileHandler={uploadFileHandler} uploading={uploading} />
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
                            src={resolveImageUrl(p.images && p.images[0] ? p.images[0] : '')} 
                            alt={p.name} 
                            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop'; }}
                            className="w-12 h-14 object-cover border border-gray-200 rounded-sm bg-gray-50" 
                          />
                          <div>
                            <span className="font-bold text-gray-900 uppercase font-heading text-xs block">{p.name}</span>
                            <span className="text-[10px] text-gray-400 font-mono">ID: {p._id.substring(18)}</span>
                            {p.sizes && p.sizes.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {p.sizes.map((sz, i) => (
                                  <span key={i} className="text-[9px] bg-gray-100 text-gray-700 font-mono px-1.5 py-0.2 rounded-xs border border-gray-200">
                                    {sz}
                                  </span>
                                ))}
                              </div>
                            )}
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

                      {/* Edit and Delete actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openEditModal(p)}
                          className="text-black hover:underline text-[11px] font-bold uppercase tracking-wider mr-3 cursor-pointer"
                        >
                          Edit
                        </button>
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

      {/* Edit Product Modal */}
      {editingProduct && (
        <EditProductModal category={category} description={description} editCustomSizeInput={editCustomSizeInput} editFormData={editFormData} editImageUrlInput={editImageUrlInput} editUploading={editUploading} editingProduct={editingProduct} handleAddEditCustomSize={handleAddEditCustomSize} handleSaveEditProduct={handleSaveEditProduct} images={images} name={name} price={price} setEditCustomSizeInput={setEditCustomSizeInput} setEditFormData={setEditFormData} setEditImageUrlInput={setEditImageUrlInput} setEditingProduct={setEditingProduct} stock={stock} subcategory={subcategory} toggleEditSize={toggleEditSize} updatingProduct={updatingProduct} uploadEditFileHandler={uploadEditFileHandler} />
      )}
    </div>
  );
};

export default AdminProducts;
