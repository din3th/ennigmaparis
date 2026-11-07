import { Upload } from 'lucide-react';
import { resolveImageUrl } from '../../../config/api';

const PromoTab = ({ formData, handlePromoImageUpload, setFormData, uploading }) => (
  <>
    <div className="space-y-6">
      {/* Promo Section Preview */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">
            Editorial Promo Banner Preview
          </h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.showPromo}
              onChange={(e) => setFormData({ ...formData, showPromo: e.target.checked })}
              className="rounded text-black w-4 h-4"
            />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
              {formData.showPromo ? 'Section Visible' : 'Section Hidden'}
            </span>
          </label>
        </div>

        {formData.showPromo && (
          <div className="relative rounded-lg overflow-hidden bg-gray-900 text-white min-h-[220px] flex items-center">
            <img
              src={resolveImageUrl(formData.promoImage)}
              alt="Promo background"
              className="absolute inset-0 w-full h-full object-cover opacity-40"
            />
            <div className="relative z-10 p-8 max-w-xl">
              <span className="text-[10px] uppercase tracking-[0.25em] text-gray-300 font-bold block mb-1">
                {formData.promoBadge || 'Editorial Feature'}
              </span>
              <h3 className="text-xl sm:text-2xl font-serif font-bold uppercase tracking-wider mb-2">
                {formData.promoTitle || "L'Art de Vivre & Parisian Craftsmanship"}
              </h3>
              <p className="text-xs text-gray-300 mb-4 leading-relaxed font-light">
                {formData.promoDescription || 'Handcrafted luxury pieces sculpted in limited editions.'}
              </p>
              <span className="inline-block border border-white text-white px-5 py-2 text-[10px] uppercase font-bold tracking-widest">
                {formData.promoButtonText || 'Discover Atelier'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Promo Banner Settings */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 border-b pb-3">
          Promo Banner Settings
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Promo Image URL
            </label>
            <input
              type="url"
              value={formData.promoImage}
              onChange={(e) => setFormData({ ...formData, promoImage: e.target.value })}
              placeholder="https://..."
              className="w-full text-xs p-3 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:outline-none"
            />
          </div>
          <div className="flex items-end">
            <label className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-xs font-bold uppercase tracking-wider rounded hover:bg-gray-50 cursor-pointer transition-colors">
              <Upload size={14} />
              {uploading ? 'Uploading...' : 'Upload Promo Image'}
              <input
                type="file"
                accept="image/*"
                onChange={handlePromoImageUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Badge Label
            </label>
            <input
              type="text"
              value={formData.promoBadge}
              onChange={(e) => setFormData({ ...formData, promoBadge: e.target.value })}
              placeholder="Editorial Feature"
              className="w-full text-xs p-3 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Promo Title
            </label>
            <input
              type="text"
              value={formData.promoTitle}
              onChange={(e) => setFormData({ ...formData, promoTitle: e.target.value })}
              placeholder="L'Art de Vivre"
              className="w-full text-xs p-3 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:outline-none font-serif font-bold"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
            Promo Description
          </label>
          <textarea
            rows={2}
            value={formData.promoDescription}
            onChange={(e) => setFormData({ ...formData, promoDescription: e.target.value })}
            placeholder="Each silhouette is sculpted with timeless elegance..."
            className="w-full text-xs p-3 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Button Text
            </label>
            <input
              type="text"
              value={formData.promoButtonText}
              onChange={(e) => setFormData({ ...formData, promoButtonText: e.target.value })}
              placeholder="Discover Atelier"
              className="w-full text-xs p-3 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Button Link
            </label>
            <input
              type="text"
              value={formData.promoButtonLink}
              onChange={(e) => setFormData({ ...formData, promoButtonLink: e.target.value })}
              placeholder="/about"
              className="w-full text-xs p-3 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  </>
);

export default PromoTab;
