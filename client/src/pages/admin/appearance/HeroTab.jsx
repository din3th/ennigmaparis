import { Check, Eye, Sparkles, Upload } from 'lucide-react';
import { resolveImageUrl } from '../../../config/api';
import { LUXURY_PRESETS } from './constants';

const HeroTab = ({ formData, handleHeroImageUpload, setFormData, uploading }) => (
  <>
    <div className="space-y-8">
      {/* Live Hero Banner Preview Card */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4 flex items-center gap-2">
          <Eye size={16} /> Live Hero Preview (What customers see)
        </h2>
        <div className="relative h-72 sm:h-96 w-full bg-black rounded-lg overflow-hidden shadow-inner">
          <img
            src={resolveImageUrl(formData.heroCoverImage)}
            alt="Hero Cover Preview"
            className="absolute inset-0 w-full h-full object-cover object-[center_35%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6 z-10">
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-gray-300 mb-2">
              {formData.heroBadge || 'Spring / Summer Haute Couture'}
            </span>
            <h3 className="text-2xl sm:text-4xl md:text-5xl font-serif tracking-widest uppercase mb-3 font-bold text-white drop-shadow-md">
              {formData.heroTitle || 'THE CALM EDIT'}
            </h3>
            <p className="text-xs sm:text-sm max-w-lg font-light mb-6 tracking-wider text-gray-200 px-4 leading-relaxed">
              {formData.heroDescription || 'A destination for timeless Parisian elegance and confident luxury.'}
            </p>
            <div className="inline-block bg-white text-black px-6 py-2.5 uppercase tracking-widest text-[11px] font-bold shadow-lg">
              {formData.heroButtonText || 'Shop The Collection'}
            </div>
          </div>
        </div>
      </div>

      {/* Cover Photo Controls */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 border-b pb-3">
          1. Hero Cover Photo Image
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Option A: Upload File */}
          <div className="border border-dashed border-gray-300 rounded-lg p-5 flex flex-col items-center justify-center text-center bg-gray-50/50 hover:bg-gray-50 transition-colors">
            <Upload size={32} className="text-gray-400 mb-2" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800 mb-1">
              Upload Cover Photo from Device
            </h4>
            <p className="text-[11px] text-gray-500 mb-4">
              Select a high-resolution landscape photo (JPG, PNG, WEBP).
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-gray-800 transition-colors cursor-pointer">
              {uploading ? 'Uploading...' : 'Browse Image'}
              <input
                type="file"
                accept="image/*"
                onChange={handleHeroImageUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          {/* Option B: Direct Image URL */}
          <div className="space-y-4 flex flex-col justify-center">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Or Enter Direct Cover Image URL:
              </label>
              <input
                type="url"
                value={formData.heroCoverImage}
                onChange={(e) => setFormData({ ...formData, heroCoverImage: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full text-xs p-3 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-gray-500">
              Tip: You can use any high-resolution image URL from Unsplash, Shopify CDN, or your own hosting.
            </p>
          </div>
        </div>

        {/* Quick Luxury Presets Picker */}
        <div className="pt-4 border-t border-gray-100">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-500" />
            One-Click Curated Luxury Presets:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {LUXURY_PRESETS.map((preset, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setFormData({
                    ...formData,
                    heroCoverImage: preset.url,
                    heroTitle: preset.title,
                    heroBadge: preset.subtitle,
                  });
                }}
                className={`group relative aspect-video rounded-md overflow-hidden cursor-pointer border-2 transition-all ${
                  formData.heroCoverImage === preset.url
                    ? 'border-black ring-2 ring-black/20'
                    : 'border-transparent hover:border-gray-400'
                }`}
              >
                <img
                  src={preset.url}
                  alt={preset.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-2 text-white">
                  <span className="text-[9px] uppercase tracking-wider text-gray-300 font-bold">
                    {preset.category}
                  </span>
                  <span className="text-[11px] font-bold truncate">{preset.name}</span>
                </div>
                {formData.heroCoverImage === preset.url && (
                  <div className="absolute top-1.5 right-1.5 bg-black text-white p-1 rounded-full">
                    <Check size={10} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Typography & CTA Controls */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 border-b pb-3">
          2. Hero Headline, Description & Button
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Top Subtitle / Badge
            </label>
            <input
              type="text"
              value={formData.heroBadge}
              onChange={(e) => setFormData({ ...formData, heroBadge: e.target.value })}
              placeholder="Spring / Summer Haute Couture"
              className="w-full text-xs p-3 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Main Hero Title
            </label>
            <input
              type="text"
              value={formData.heroTitle}
              onChange={(e) => setFormData({ ...formData, heroTitle: e.target.value })}
              placeholder="THE CALM EDIT"
              className="w-full text-xs p-3 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:outline-none font-serif font-bold uppercase"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
            Hero Description / Subheading
          </label>
          <textarea
            rows={2}
            value={formData.heroDescription}
            onChange={(e) => setFormData({ ...formData, heroDescription: e.target.value })}
            placeholder="A destination for timeless Parisian elegance and confident luxury."
            className="w-full text-xs p-3 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Call to Action Button Label
            </label>
            <input
              type="text"
              value={formData.heroButtonText}
              onChange={(e) => setFormData({ ...formData, heroButtonText: e.target.value })}
              placeholder="Shop The Collection"
              className="w-full text-xs p-3 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Button Destination Link
            </label>
            <input
              type="text"
              value={formData.heroButtonLink}
              onChange={(e) => setFormData({ ...formData, heroButtonLink: e.target.value })}
              placeholder="/shop?collection=the-calm-edit"
              className="w-full text-xs p-3 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  </>
);

export default HeroTab;
