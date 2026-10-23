import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  description: { type: String, default: '' },
  imageUrl: { type: String, required: true },
  buttonText: { type: String, default: 'Shop Now' },
  buttonLink: { type: String, default: '/shop' },
  active: { type: Boolean, default: true },
});

const appearanceSchema = new mongoose.Schema(
  {
    // Hero Cover Photo & Content
    heroBadge: {
      type: String,
      default: 'Spring / Summer Haute Couture',
    },
    heroTitle: {
      type: String,
      default: 'THE CALM EDIT',
    },
    heroDescription: {
      type: String,
      default: 'A destination for timeless Parisian elegance and confident luxury.',
    },
    heroCoverImage: {
      type: String,
      default: 'https://plus.unsplash.com/premium_photo-1664202526559-e21e9c0fb46a?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    heroButtonText: {
      type: String,
      default: 'Shop The Collection',
    },
    heroButtonLink: {
      type: String,
      default: '/shop?collection=the-calm-edit',
    },

    // Carousel Cover Slides
    banners: [bannerSchema],

    // Top Announcement Bar
    showAnnouncement: {
      type: Boolean,
      default: true,
    },
    announcementText: {
      type: String,
      default: 'Complimentary Worldwide Express Delivery on Orders Over $250 • ENNIGMA PARIS',
    },

    // Editorial Promo Banner
    showPromo: {
      type: Boolean,
      default: true,
    },
    promoBadge: {
      type: String,
      default: 'Editorial Feature',
    },
    promoTitle: {
      type: String,
      default: 'L\'Art de Vivre & Parisian Craftsmanship',
    },
    promoDescription: {
      type: String,
      default: 'Each silhouette is sculpted with timeless elegance, utilizing bespoke fabrics and fine artisanal tailoring.',
    },
    promoImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop',
    },
    promoButtonText: {
      type: String,
      default: 'Discover Atelier',
    },
    promoButtonLink: {
      type: String,
      default: '/about',
    },

    // Executive Notifications (Owner & Manager)
    notificationSettings: {
      ownerEmail: { type: String, default: '' },
      ownerPhone: { type: String, default: '' },
      managerEmail: { type: String, default: '' },
      managerPhone: { type: String, default: '' },
      enableEmailAlerts: { type: Boolean, default: true },
      enableWhatsAppAlerts: { type: Boolean, default: true },
      whatsappProvider: { type: String, default: 'twilio' },
      enableTelegramAlerts: { type: Boolean, default: true },
      telegramChatId: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

const Appearance = mongoose.model('Appearance', appearanceSchema);

export default Appearance;
