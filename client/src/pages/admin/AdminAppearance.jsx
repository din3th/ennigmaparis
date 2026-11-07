import { useState, useEffect } from 'react';
import axios from 'axios';
import { Image, Eye, Save, RefreshCw, Sparkles, Sliders, Layers, ExternalLink, CheckCircle2, AlertCircle, Bell } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import HeroTab from './appearance/HeroTab';
import CarouselTab from './appearance/CarouselTab';
import AnnouncementTab from './appearance/AnnouncementTab';
import PromoTab from './appearance/PromoTab';
import NotificationsTab from './appearance/NotificationsTab';

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


  // Fetch current appearance settings
  const fetchAppearance = async () => {
    try {
      setLoading(true);
      const config = {};
      const { data } = await axios.get(`${API_BASE_URL}/appearance`, config);
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
        headers: { },
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
        headers: {
          'Content-Type': 'multipart/form-data',
          },
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
        headers: {
          'Content-Type': 'multipart/form-data',
          },
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
        headers: {
          'Content-Type': 'multipart/form-data',
          },
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
        <HeroTab formData={formData} handleHeroImageUpload={handleHeroImageUpload} setFormData={setFormData} uploading={uploading} />
      )}

      {/* TAB 2: MULTI-SLIDE CAROUSEL COVER PHOTOS */}
      {activeTab === 'carousel' && (
        <CarouselTab formData={formData} handleAddBanner={handleAddBanner} handleBannerUpload={handleBannerUpload} handleDeleteBanner={handleDeleteBanner} handleUpdateBanner={handleUpdateBanner} />
      )}

      {/* TAB 3: ANNOUNCEMENT BAR */}
      {activeTab === 'announcement' && (
        <AnnouncementTab formData={formData} setFormData={setFormData} />
      )}

      {/* TAB 4: EDITORIAL PROMO BANNER */}
      {activeTab === 'promo' && (
        <PromoTab formData={formData} handlePromoImageUpload={handlePromoImageUpload} setFormData={setFormData} uploading={uploading} />
      )}

      {/* TAB 5: EXECUTIVE NOTIFICATIONS (EMAIL & WHATSAPP) */}
      {activeTab === 'notifications' && (
        <NotificationsTab formData={formData} handleSendTestNotification={handleSendTestNotification} setFormData={setFormData} testResult={testResult} testingNotif={testingNotif} />
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
