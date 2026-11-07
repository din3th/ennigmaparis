import { resolveImageUrl } from '../../../config/api';
import { PRESET_SIZES } from './constants';

const EditProductModal = ({ category, description, editCustomSizeInput, editFormData, editImageUrlInput, editUploading, editingProduct, handleAddEditCustomSize, handleSaveEditProduct, images, name, price, setEditCustomSizeInput, setEditFormData, setEditImageUrlInput, setEditingProduct, stock, subcategory, toggleEditSize, updatingProduct, uploadEditFileHandler }) => (
  <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white max-w-2xl w-full p-6 sm:p-8 rounded-sm shadow-2xl relative border border-gray-100 max-h-[90vh] overflow-y-auto font-sans">
        <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900">
            Edit Product: {editingProduct.name}
          </h2>
          <button
            onClick={() => setEditingProduct(null)}
            className="text-gray-400 hover:text-black font-bold text-lg"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSaveEditProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-medium text-gray-700 mb-1">Product Title *</label>
            <input
              className="w-full border border-gray-200 p-2.5 rounded-sm focus:border-black focus:outline-none"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Price (LKR) *</label>
            <input
              type="number"
              className="w-full border border-gray-200 p-2.5 rounded-sm focus:border-black focus:outline-none"
              value={editFormData.price}
              onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Sale Price (Optional)</label>
            <input
              type="number"
              placeholder="Leave empty if not on sale"
              className="w-full border border-gray-200 p-2.5 rounded-sm focus:border-black focus:outline-none"
              value={editFormData.salePrice}
              onChange={(e) => setEditFormData({ ...editFormData, salePrice: e.target.value })}
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Stock Count *</label>
            <input
              type="number"
              className="w-full border border-gray-200 p-2.5 rounded-sm focus:border-black focus:outline-none"
              value={editFormData.stock}
              onChange={(e) => setEditFormData({ ...editFormData, stock: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Category *</label>
            <select
              className="w-full border border-gray-200 p-2.5 rounded-sm focus:border-black focus:outline-none bg-white"
              value={editFormData.category}
              onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
              required
            >
              <option value="Women">Women</option>
              <option value="Accessories">Accessories</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Subcategory</label>
            <input
              className="w-full border border-gray-200 p-2.5 rounded-sm focus:border-black focus:outline-none"
              value={editFormData.subcategory}
              onChange={(e) => setEditFormData({ ...editFormData, subcategory: e.target.value })}
            />
          </div>

          {/* Interactive Sizing Manager for Edit Product */}
          <div className="sm:col-span-2 bg-gray-50 border border-gray-200 p-4 rounded-sm space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Product Sizes * ({Array.isArray(editFormData.sizes) ? editFormData.sizes.length : 0} Configured)
                </label>
                <span className="text-[11px] text-gray-500">
                  Toggle preset chips or add custom sizes to update store stock choices.
                </span>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setEditFormData({ ...editFormData, sizes: ['UK 6', 'UK 8', 'UK 10', 'UK 12', 'UK 14'] })}
                  className="text-[10px] uppercase font-bold text-gray-600 bg-white border border-gray-200 px-2 py-1 rounded hover:bg-black hover:text-white transition-colors"
                >
                  UK 6-14
                </button>
                <button
                  type="button"
                  onClick={() => setEditFormData({ ...editFormData, sizes: ['XS', 'S', 'M', 'L', 'XL'] })}
                  className="text-[10px] uppercase font-bold text-gray-600 bg-white border border-gray-200 px-2 py-1 rounded hover:bg-black hover:text-white transition-colors"
                >
                  XS-XL
                </button>
                <button
                  type="button"
                  onClick={() => setEditFormData({ ...editFormData, sizes: [] })}
                  className="text-[10px] uppercase font-bold text-red-600 bg-white border border-red-200 px-2 py-1 rounded hover:bg-red-600 hover:text-white transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Preset Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESET_SIZES.map((sz) => {
                const currentSizes = Array.isArray(editFormData.sizes) ? editFormData.sizes : [];
                const isChecked = currentSizes.includes(sz);
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => toggleEditSize(sz)}
                    className={`px-3 py-1 text-xs font-mono font-bold rounded transition-all cursor-pointer border ${
                      isChecked
                        ? 'bg-black text-white border-black shadow-xs'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-black'
                    }`}
                  >
                    {sz} {isChecked ? '✓' : '+'}
                  </button>
                );
              })}
            </div>

            {/* Custom Size Adder */}
            <div className="flex gap-2 pt-2 border-t border-gray-200">
              <input
                type="text"
                placeholder="Add custom size (e.g. UK 20, 38 EU, Petite, Tailored)..."
                value={editCustomSizeInput}
                onChange={(e) => setEditCustomSizeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddEditCustomSize(e);
                  }
                }}
                className="flex-1 border border-gray-300 p-2 text-xs bg-white focus:border-black focus:outline-none rounded-xs font-mono"
              />
              <button
                type="button"
                onClick={handleAddEditCustomSize}
                className="bg-gray-800 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xs hover:bg-black transition-colors"
              >
                + Add Size
              </button>
            </div>

            {/* Active Selected Size Tags */}
            {Array.isArray(editFormData.sizes) && editFormData.sizes.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] uppercase font-bold text-gray-500 mr-1">Active Sizes:</span>
                {editFormData.sizes.map((sz) => (
                  <span
                    key={sz}
                    className="inline-flex items-center gap-1 bg-black text-white font-mono text-[11px] font-bold px-2 py-0.5 rounded-xs"
                  >
                    {sz}
                    <button
                      type="button"
                      onClick={() => toggleEditSize(sz)}
                      className="text-gray-400 hover:text-white font-bold ml-0.5 cursor-pointer"
                      title="Remove size"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Product Gallery Images (Upload or URL) */}
          <div className="sm:col-span-2 space-y-2">
            <label className="block font-medium text-gray-700 mb-1">Product Images (Upload or Add URL)</label>
            <div className="flex gap-2">
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                className="w-full border border-gray-200 p-2 text-xs" 
                onChange={uploadEditFileHandler} 
              />
            </div>
            {editUploading && <p className="text-[11px] text-gray-400">Uploading image files...</p>}
            <div className="flex gap-2 pt-1">
              <input
                type="url"
                placeholder="Or paste image URL (https://...)"
                value={editImageUrlInput}
                onChange={(e) => setEditImageUrlInput(e.target.value)}
                className="flex-1 border border-gray-200 p-2 text-xs focus:border-black focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (editImageUrlInput) {
                    setEditFormData({ ...editFormData, images: [...(editFormData.images || []), editImageUrlInput] });
                    setEditImageUrlInput('');
                  }
                }}
                className="bg-gray-100 hover:bg-black hover:text-white px-4 py-2 font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer text-xs"
              >
                + Add URL
              </button>
            </div>

            {/* Previews */}
            {editFormData.images && editFormData.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {editFormData.images.map((img, idx) => (
                  <div key={idx} className="relative w-14 h-18 bg-gray-100 border border-gray-200 rounded-sm overflow-hidden">
                    <img src={resolveImageUrl(img)} alt="Thumb" onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop'; }} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setEditFormData({
                          ...editFormData,
                          images: editFormData.images.filter((_, i) => i !== idx),
                        });
                      }}
                      className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows="3"
              className="w-full border border-gray-200 p-2.5 rounded-sm focus:border-black focus:outline-none"
              value={editFormData.description}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
            />
          </div>

          <div className="sm:col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="editFeatured"
              checked={editFormData.isFeatured}
              onChange={(e) => setEditFormData({ ...editFormData, isFeatured: e.target.checked })}
              className="accent-black w-4 h-4"
            />
            <label htmlFor="editFeatured" className="text-gray-700 font-bold uppercase tracking-wider text-[11px] cursor-pointer">
              Feature in "The Calm Edit" Hero & Catalog
            </label>
          </div>

          <div className="sm:col-span-2 flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setEditingProduct(null)}
              className="border border-gray-300 px-5 py-2.5 uppercase font-bold tracking-wider hover:border-black transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updatingProduct}
              className="bg-black text-white px-6 py-2.5 uppercase font-bold tracking-wider hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-sm"
            >
              {updatingProduct ? 'Saving...' : 'Update Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </>
);

export default EditProductModal;
