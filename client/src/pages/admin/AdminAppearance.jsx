import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Image, 
  Upload, 
  Plus, 
  Trash2, 
  Eye, 
  Check, 
  Save, 
  RefreshCw, 
  Sparkles, 
  Sliders, 
  Layers, 
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Bell,
  Phone,
  Mail,
  MessageSquare,
  Send
} from 'lucide-react';
import { API_BASE_URL, resolveImageUrl } from '../../config/api';

// Curated Luxury Parisian High-Fashion Editorial Presets
const LUXURY_PRESETS = [
  {
    name: 'Editorial Haute Couture',
    category: 'Editorial',
    url: 'https://plus.unsplash.com/premium_photo-1664202526559-e21e9c0fb46a?q=80&w=1740&auto=format&fit=crop',
    title: 'THE CALM EDIT',
    subtitle: 'Spring / Summer Haute Couture',
  },
  {
    name: 'Parisian Studio Atelier',
    category: 'Minimal Luxury',
    url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop',
    title: 'EVENING SILHOUETTES',
    subtitle: 'Signature Capsule',
  },
  {
    name: 'Elysée Elegance',
    category: 'Runway',
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1600&auto=format&fit=crop',
    title: 'PARIS NOIR',
    subtitle: 'Limited Editions',
  },
  {
    name: 'Monochrome Chic',
    category: 'Modern Couture',
    url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1600&auto=format&fit=crop',
    title: 'THE MODERN ATELIER',
    subtitle: 'Bespoke Craftsmanship',
  },
];

const AdminAppearance = () => {
  const [activeTab, setActiveTab] = useState('hero');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [testingNotif, setTestingNotif] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Appearance Form State
  const [formData, setFormData] = useState({
    heroBadge: 'Spring / Summer Haute Couture',
    heroTitle: 'THE CALM EDIT',
    heroDescription: 'A destination for timeless Parisian elegance and confident luxury.',
    heroCoverImage: '',
    heroButtonText: 'Shop The Collection',
    heroButtonLink: '/shop?collection=the-calm-edit',
    banners: [],
    showAnnouncement: true,
    announcementText: 'Complimentary Worldwide Express Delivery on Orders Over $250 • ENNIGMA PARIS',
    showPromo: true,
    promoBadge: 'Editorial Feature',
    promoTitle: "L'Art de Vivre & Parisian Craftsmanship",
    promoDescription: 'Each silhouette is sculpted with timeless elegance, utilizing bespoke fabrics and fine artisanal tailoring.',
    promoImage: '',
    promoButtonText: 'Discover Atelier',
    promoButtonLink: '/about',
    notificationSettings: {
      ownerEmail: '',
      ownerPhone: '',
      managerEmail: '',
      managerPhone: '',
      enableEmailAlerts: true,
      enableWhatsAppAlerts: true,
      whatsappProvider: 'twilio',
    },
  });

  const token = localStorage.getItem('adminToken') || localStorage.getItem('token');

  // Fetch current appearance settings
  const fetchAppearance = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE_URL}/appearance`);
      if (data) {
        setFormData({
          heroBadge: data.heroBadge || '',
          heroTitle: data.heroTitle || '',
          heroDescription: data.heroDescription || '',
          heroCoverImage: data.heroCoverImage || '',
          heroButtonText: data.heroButtonText || 'Shop The Collection',
          heroButtonLink: data.heroButtonLink || '/shop',
          banners: Array.isArray(data.banners) ? data.banners : [],
          showAnnouncement: data.showAnnouncement !== undefined ? data.showAnnouncement : true,
          announcementText: data.announcementText || '',
          showPromo: data.showPromo !== undefined ? data.showPromo : true,
          promoBadge: data.promoBadge || '',
          promoTitle: data.promoTitle || '',
          promoDescription: data.promoDescription || '',
          promoImage: data.promoImage || '',
          promoButtonText: data.promoButtonText || 'Discover Atelier',
          promoButtonLink: data.promoButtonLink || '/about',
          notificationSettings: {
            ownerEmail: data.notificationSettings?.ownerEmail || '',
            ownerPhone: data.notificationSettings?.ownerPhone || '',
            managerEmail: data.notificationSettings?.managerEmail || '',
            managerPhone: data.notificationSettings?.managerPhone || '',
            enableEmailAlerts: data.notificationSettings?.enableEmailAlerts !== false,
            enableWhatsAppAlerts: data.notificationSettings?.enableWhatsAppAlerts !== false,
            whatsappProvider: data.notificationSettings?.whatsappProvider || 'twilio',
          },
        });
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching appearance:', err);
      setErrorMsg('Failed to load appearance settings.');
      setLoading(false);
    }
  };

  const handleSendTestNotification = async () => {
    setTestingNotif(true);
    setTestResult(null);
    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };
      const { data } = await axios.post(
        `${API_BASE_URL}/appearance/test-notifications`,
        formData.notificationSettings,
        config
      );
      setTestResult({ success: true, ...data });
    } catch (err) {
      setTestResult({ success: false, message: err.response?.data?.message || err.message });
    } finally {
      setTestingNotif(false);
    }
  };

  useEffect(() => {
    fetchAppearance();
  }, []);

  // Save changes to database
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };
      await axios.put(`${API_BASE_URL}/appearance`, formData, config);
      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Error saving appearance:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to save appearance settings.');
      setSaving(false);
    }
  };

  // Image Upload handler for Hero Cover Photo
  const handleHeroImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('image', file);

    setUploading(true);
    setErrorMsg(null);

    try {
      const { data } = await axios.post(`${API_BASE_URL}/upload/single`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploadedUrl = data.image || data.images?.[0];
      setFormData((prev) => ({ ...prev, heroCoverImage: uploadedUrl }));
      setUploading(false);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload image. Please try again or use an image URL.');
      setUploading(false);
    }
  };

  // Image Upload handler for Promo Banner
  const handlePromoImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('image', file);

    setUploading(true);
    try {
      const { data } = await axios.post(`${API_BASE_URL}/upload/single`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploadedUrl = data.image || data.images?.[0];
      setFormData((prev) => ({ ...prev, promoImage: uploadedUrl }));
      setUploading(false);
    } catch {
      alert('Failed to upload image.');
      setUploading(false);
    }
  };

  // Banner Slides Management
  const handleAddBanner = () => {
    const newBanner = {
      _id: `slide_${Date.now()}`,
      title: 'NEW COLLECTION',
      subtitle: 'Exclusive Capsule',
      description: 'Discover the latest Parisian silhouettes sculpted in couture fabrics.',
      imageUrl: formData.heroCoverImage || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop',
      buttonText: 'Explore Now',
      buttonLink: '/shop',
      active: true,
    };
    setFormData((prev) => ({
      ...prev,
      banners: [...prev.banners, newBanner],
    }));
  };

  const handleUpdateBanner = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.banners];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, banners: updated };
    });
  };

  const handleDeleteBanner = (index) => {
    setFormData((prev) => ({
      ...prev,
      banners: prev.banners.filter((_, idx) => idx !== index),
    }));
  };

  const handleBannerUpload = async (index, file) => {
    if (!file) return;
    const uploadData = new FormData();
    uploadData.append('image', file);
    try {
      const { data } = await axios.post(`${API_BASE_URL}/upload/single`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploadedUrl = data.image || data.images?.[0];
      handleUpdateBanner(index, 'imageUrl', uploadedUrl);
    } catch {
      alert('Failed to upload slide image.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-500">
        <RefreshCw className="w-8 h-8 animate-spin mb-3 text-black" />
        <p className="text-sm tracking-wider uppercase">Loading Appearance Settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-widest bg-black text-white rounded">
              Storefront Studio
            </span>
            <span className="text-xs text-gray-500">Live Appearance Control</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 tracking-wide uppercase">
            Storefront Appearance & Cover Photos
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage your homepage hero cover photos, sliding banners, announcement bar, and luxury editorial sections.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 rounded transition-colors"
          >
            <Eye size={14} />
            View Store
            <ExternalLink size={12} className="text-gray-400" />
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 rounded transition-all shadow-md disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={14} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccess && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm transition-all animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
          <span>Appearance settings saved successfully! Changes are live on your storefront.</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-4 rounded-t-lg shadow-sm gap-2 sm:gap-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('hero')}
          className={`py-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'hero'
              ? 'border-black text-black'
              : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          <Image size={15} />
          Hero Cover Photo
        </button>
        <button
          onClick={() => setActiveTab('carousel')}
          className={`py-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'carousel'
              ? 'border-black text-black'
              : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          <Layers size={15} />
          Cover Slides ({formData.banners.length})
        </button>
        <button
          onClick={() => setActiveTab('announcement')}
          className={`py-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'announcement'
              ? 'border-black text-black'
              : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          <Sparkles size={15} />
          Announcement Bar
        </button>
        <button
          onClick={() => setActiveTab('promo')}
          className={`py-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'promo'
              ? 'border-black text-black'
              : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          <Sliders size={15} />
          Editorial Promo Banner
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`py-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'notifications'
              ? 'border-black text-black'
              : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          <Bell size={15} />
          Executive Alerts (Email, Telegram & WhatsApp)
        </button>
      </div>

      {/* TAB 1: HERO COVER PHOTO */}
      {activeTab === 'hero' && (
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
      )}

      {/* TAB 2: MULTI-SLIDE CAROUSEL COVER PHOTOS */}
      {activeTab === 'carousel' && (
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
      )}

      {/* TAB 3: ANNOUNCEMENT BAR */}
      {activeTab === 'announcement' && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">
                Top Announcement Bar
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Displays a sleek banner across the very top of the website for promotions, delivery offers, or notices.
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showAnnouncement}
                onChange={(e) => setFormData({ ...formData, showAnnouncement: e.target.checked })}
                className="rounded text-black w-4 h-4"
              />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                {formData.showAnnouncement ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>

          {/* Live Preview Bar */}
          {formData.showAnnouncement && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                Live Preview:
              </label>
              <div className="bg-black text-white py-2 px-4 text-center text-xs tracking-widest uppercase font-medium">
                {formData.announcementText || 'Your announcement message goes here...'}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
              Announcement Message
            </label>
            <input
              type="text"
              value={formData.announcementText}
              onChange={(e) => setFormData({ ...formData, announcementText: e.target.value })}
              placeholder="Complimentary Worldwide Express Delivery on Orders Over $250 • ENNIGMA PARIS"
              className="w-full text-xs p-3 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:outline-none"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Supports delivery notices, holiday greetings, discount promotions, or VIP club invitations.
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: EDITORIAL PROMO BANNER */}
      {activeTab === 'promo' && (
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
      )}

      {/* TAB 5: EXECUTIVE NOTIFICATIONS (EMAIL & WHATSAPP) */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          {/* Header Info Banner */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-widest bg-emerald-600 text-white rounded">
                  Live Dispatcher
                </span>
                <span className="text-xs text-gray-500">Order Alerts to Owner & Manager</span>
              </div>
              <h2 className="text-lg font-serif font-bold text-gray-900 tracking-wide uppercase">
                Owner & Manager Real-Time Order Alerts
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                When a customer places an order or submits a bank transfer receipt, automated high-priority email and WhatsApp alerts are dispatched to the owner and manager simultaneously.
              </p>
            </div>

            {/* Test Notification Button */}
            <button
              type="button"
              onClick={handleSendTestNotification}
              disabled={testingNotif}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-gray-800 text-white text-xs font-bold uppercase tracking-widest rounded transition-all shadow-md disabled:opacity-50 cursor-pointer flex-shrink-0"
            >
              {testingNotif ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Dispatching Test Alerts...
                </>
              ) : (
                <>
                  <Send size={14} />
                  Send Test Alert Now
                </>
              )}
            </button>
          </div>

          {/* Test Result Feedback Box */}
          {testResult && (
            <div
              className={`p-4 rounded-lg border text-xs space-y-2 animate-in fade-in ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{testResult.message}</span>
              </div>
              {testResult.emailStatus && (
                <div className="pl-6 text-[11px] text-gray-700">
                  • <strong>Email Status:</strong> {testResult.emailStatus}
                </div>
              )}
              {testResult.telegramStatus && (
                <div className="pl-6 text-[11px] text-gray-700">
                  • <strong>Telegram Status:</strong> <span className={testResult.telegramStatus.includes('success') ? 'text-emerald-700 font-bold' : 'text-gray-700'}>{testResult.telegramStatus}</span>
                </div>
              )}
              {testResult.waResults && testResult.waResults.length > 0 && (
                <div className="pl-6 space-y-1 text-[11px] text-gray-700">
                  {testResult.waResults.map((r, idx) => (
                    <div key={idx} className="flex items-center gap-2 flex-wrap">
                      <span>• <strong>WhatsApp ({r.recipient}):</strong> {r.phone} — {r.provider || (r.fallback ? 'Click-to-chat ready' : 'Processed')}</span>
                      {r.waLink && (
                        <a
                          href={r.waLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 underline font-bold hover:text-emerald-900"
                        >
                          Open in WhatsApp
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. System Owner Settings */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b pb-3">
                <span className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">
                  System Owner Contact
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1 flex items-center gap-1.5">
                  <Mail size={13} className="text-gray-400" />
                  Owner Email Address
                </label>
                <input
                  type="email"
                  value={formData.notificationSettings?.ownerEmail || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notificationSettings: {
                        ...formData.notificationSettings,
                        ownerEmail: e.target.value,
                      },
                    })
                  }
                  placeholder="owner@ennigmaparis.com"
                  className="w-full text-xs p-3 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:outline-none"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Receives full executive PDF invoices, customer delivery details, and payment slips.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1 flex items-center gap-1.5">
                  <MessageSquare size={13} className="text-emerald-600" />
                  Owner WhatsApp Phone Number
                </label>
                <input
                  type="text"
                  value={formData.notificationSettings?.ownerPhone || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notificationSettings: {
                        ...formData.notificationSettings,
                        ownerPhone: e.target.value,
                      },
                    })
                  }
                  placeholder="+94 77 123 4567 or 0771234567"
                  className="w-full text-xs p-3 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:outline-none font-mono"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Include country code (e.g. +94 for Sri Lanka). Receives instant WhatsApp order summaries.
                </p>
              </div>
            </div>

            {/* 2. System Manager Settings */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b pb-3">
                <span className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800">
                  Operations Manager Contact
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1 flex items-center gap-1.5">
                  <Mail size={13} className="text-gray-400" />
                  Manager Email Address
                </label>
                <input
                  type="email"
                  value={formData.notificationSettings?.managerEmail || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notificationSettings: {
                        ...formData.notificationSettings,
                        managerEmail: e.target.value,
                      },
                    })
                  }
                  placeholder="manager@ennigmaparis.com"
                  className="w-full text-xs p-3 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:outline-none"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Operations copy for packaging, fulfillment, and bank transfer validation.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1 flex items-center gap-1.5">
                  <MessageSquare size={13} className="text-emerald-600" />
                  Manager WhatsApp Phone Number
                </label>
                <input
                  type="text"
                  value={formData.notificationSettings?.managerPhone || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notificationSettings: {
                        ...formData.notificationSettings,
                        managerPhone: e.target.value,
                      },
                    })
                  }
                  placeholder="+94 71 987 6543 or 0719876543"
                  className="w-full text-xs p-3 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:outline-none font-mono"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Instant mobile notification for immediate warehouse packing & fulfillment.
                </p>
              </div>
            </div>
          </div>

          {/* 3. Channels & Automation Preferences */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 border-b pb-3">
              3. Channel Controls & Provider
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.notificationSettings?.enableEmailAlerts !== false}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notificationSettings: {
                        ...formData.notificationSettings,
                        enableEmailAlerts: e.target.checked,
                      },
                    })
                  }
                  className="mt-0.5 rounded text-black w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-900 block">
                    Email Notifications
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Dispatches high-priority order invoice & customer details via SMTP.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.notificationSettings?.enableWhatsAppAlerts !== false}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notificationSettings: {
                        ...formData.notificationSettings,
                        enableWhatsAppAlerts: e.target.checked,
                      },
                    })
                  }
                  className="mt-0.5 rounded text-black w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-900 block">
                    WhatsApp Notifications
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Sends structured WhatsApp messages with items, total, and address.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border border-sky-200 bg-sky-50/50 rounded-lg cursor-pointer hover:bg-sky-50 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.notificationSettings?.enableTelegramAlerts !== false}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notificationSettings: {
                        ...formData.notificationSettings,
                        enableTelegramAlerts: e.target.checked,
                      },
                    })
                  }
                  className="mt-0.5 rounded text-sky-600 w-4 h-4"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-900 block">
                      Telegram Push Alerts
                    </span>
                    <span className="px-1.5 py-0.2 text-[9px] bg-sky-500 text-white rounded font-bold">
                      ACTIVE
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-600">
                    Bot: @Ennigma_Paris_Admin_Bot • Real-time alerts directly to your device.
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                WhatsApp Dispatch Gateway
              </label>
              <select
                value={formData.notificationSettings?.whatsappProvider || 'twilio'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    notificationSettings: {
                      ...formData.notificationSettings,
                      whatsappProvider: e.target.value,
                    },
                  })
                }
                className="w-full text-xs p-3 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:outline-none bg-white"
              >
                <option value="twilio">Twilio WhatsApp API (Automated Cloud Delivery)</option>
                <option value="callmebot">CallMeBot WhatsApp API (Free Personal Gateway)</option>
                <option value="ultramsg">UltraMsg WhatsApp Gateway</option>
                <option value="clicktochat">Direct WhatsApp Click-to-Chat Link Mode</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Floating Save Button at bottom */}
      <div className="sticky bottom-4 z-40 bg-white/95 backdrop-blur-md p-4 rounded-lg border border-gray-200 shadow-xl flex justify-between items-center">
        <span className="text-xs text-gray-500 hidden sm:inline">
          Click <strong>Save Changes</strong> to publish your appearance updates live across all devices.
        </span>
        <button
          onClick={handleSave}
          disabled={saving}
          className="ml-auto inline-flex items-center gap-2 px-8 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 rounded transition-all shadow-md disabled:opacity-50 cursor-pointer"
        >
          {saving ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              Saving Changes...
            </>
          ) : (
            <>
              <Save size={14} />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AdminAppearance;
