import { resolveImageUrl } from '../../../config/api';
import { PRESET_SIZES } from './constants';

const AddProductForm = ({ category, customSizeInput, description, handleAddCustomSize, handleAddImageUrl, handleAddProduct, handleRemoveImage, imageUrlInput, images, name, price, selectedSizes, setCategory, setCustomSizeInput, setDescription, setImageUrlInput, setName, setPrice, setSelectedSizes, setStock, setSubcategory, stock, subcategory, toggleAddSize, uploadFileHandler, uploading }) => (
  <>
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

        {/* Interactive Sizing Manager for New Product */}
        <div className="sm:col-span-2 bg-gray-50 border border-gray-200 p-4 rounded-sm space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider">
                Available Garment Sizes * ({selectedSizes.length} Selected)
              </label>
              <span className="text-[11px] text-gray-500">
                Click preset buttons or type custom sizes. These sizes will be selectable on the storefront.
              </span>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedSizes(['UK 6', 'UK 8', 'UK 10', 'UK 12', 'UK 14'])}
                className="text-[10px] uppercase font-bold text-gray-600 bg-white border border-gray-200 px-2 py-1 rounded hover:bg-black hover:text-white transition-colors"
              >
                UK 6-14
              </button>
              <button
                type="button"
                onClick={() => setSelectedSizes(['XS', 'S', 'M', 'L', 'XL'])}
                className="text-[10px] uppercase font-bold text-gray-600 bg-white border border-gray-200 px-2 py-1 rounded hover:bg-black hover:text-white transition-colors"
              >
                XS-XL
              </button>
              <button
                type="button"
                onClick={() => setSelectedSizes([])}
                className="text-[10px] uppercase font-bold text-red-600 bg-white border border-red-200 px-2 py-1 rounded hover:bg-red-600 hover:text-white transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Preset Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {PRESET_SIZES.map((sz) => {
              const isChecked = selectedSizes.includes(sz);
              return (
                <button
                  key={sz}
                  type="button"
                  onClick={() => toggleAddSize(sz)}
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
              value={customSizeInput}
              onChange={(e) => setCustomSizeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomSize(e);
                }
              }}
              className="flex-1 border border-gray-300 p-2 text-xs bg-white focus:border-black focus:outline-none rounded-xs font-mono"
            />
            <button
              type="button"
              onClick={handleAddCustomSize}
              className="bg-gray-800 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xs hover:bg-black transition-colors"
            >
              + Add Size
            </button>
          </div>

          {/* Active Selected Size Tags */}
          {selectedSizes.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] uppercase font-bold text-gray-500 mr-1">Active Sizes:</span>
              {selectedSizes.map((sz) => (
                <span
                  key={sz}
                  className="inline-flex items-center gap-1 bg-black text-white font-mono text-[11px] font-bold px-2 py-0.5 rounded-xs"
                >
                  {sz}
                  <button
                    type="button"
                    onClick={() => toggleAddSize(sz)}
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
                    <img src={resolveImageUrl(img)} alt={`Preview ${idx + 1}`} onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop'; }} className="w-full h-full object-cover" />
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
  </>
);

export default AddProductForm;
