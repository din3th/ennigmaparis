import { Layers, Plus, Trash2 } from 'lucide-react';
import { resolveImageUrl } from '../../../config/api';

const CarouselTab = ({ formData, handleAddBanner, handleBannerUpload, handleDeleteBanner, handleUpdateBanner }) => (
  <>
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">
            Rotating Cover Banners & Slides
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Add multiple cover photos. When multiple active slides are configured, the homepage hero will rotate seamlessly between them.
          </p>
        </div>
        <button
          onClick={handleAddBanner}
          className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <Plus size={14} /> Add New Slide
        </button>
      </div>

      {formData.banners.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg border border-gray-200">
          <Layers size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-600 font-medium">No additional cover slides yet.</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">
            The homepage will display the main Hero Cover Photo. Add slides to turn it into an editorial carousel!
          </p>
          <button
            onClick={handleAddBanner}
            className="inline-flex items-center gap-2 px-4 py-2 border border-black text-xs font-bold uppercase tracking-wider rounded hover:bg-black hover:text-white transition-colors cursor-pointer"
          >
            <Plus size={14} /> Add First Slide
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {formData.banners.map((banner, index) => (
            <div
              key={banner._id || index}
              className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4"
            >
              <div className="flex justify-between items-center border-b pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                  <span className="w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-[10px]">
                    {index + 1}
                  </span>
                  Slide {index + 1}: {banner.title || 'Untitled Banner'}
                </span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={banner.active !== false}
                      onChange={(e) => handleUpdateBanner(index, 'active', e.target.checked)}
                      className="rounded text-black"
                    />
                    Active on Store
                  </label>
                  <button
                    onClick={() => handleDeleteBanner(index)}
                    className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                    title="Delete Slide"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Slide Thumbnail Preview */}
                <div className="relative aspect-video bg-gray-100 rounded overflow-hidden border">
                  <img
                    src={resolveImageUrl(banner.imageUrl)}
                    alt="Slide preview"
                    className="w-full h-full object-cover"
                  />
                  <label className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/80 hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider rounded backdrop-blur-sm cursor-pointer transition-colors">
                    Change Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleBannerUpload(index, e.target.files?.[0])}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Slide Text Inputs */}
                <div className="md:col-span-2 space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Cover Image URL
                    </label>
                    <input
                      type="url"
                      value={banner.imageUrl}
                      onChange={(e) => handleUpdateBanner(index, 'imageUrl', e.target.value)}
                      placeholder="https://..."
                      className="w-full text-xs p-2 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                        Slide Headline
                      </label>
                      <input
                        type="text"
                        value={banner.title}
                        onChange={(e) => handleUpdateBanner(index, 'title', e.target.value)}
                        placeholder="Title"
                        className="w-full text-xs p-2 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:outline-none uppercase font-serif"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                        Slide Subtitle
                      </label>
                      <input
                        type="text"
                        value={banner.subtitle}
                        onChange={(e) => handleUpdateBanner(index, 'subtitle', e.target.value)}
                        placeholder="Subtitle / Badge"
                        className="w-full text-xs p-2 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                        Button Label
                      </label>
                      <input
                        type="text"
                        value={banner.buttonText}
                        onChange={(e) => handleUpdateBanner(index, 'buttonText', e.target.value)}
                        placeholder="Shop Now"
                        className="w-full text-xs p-2 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                        Destination Link
                      </label>
                      <input
                        type="text"
                        value={banner.buttonLink}
                        onChange={(e) => handleUpdateBanner(index, 'buttonLink', e.target.value)}
                        placeholder="/shop"
                        className="w-full text-xs p-2 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </>
);

export default CarouselTab;
