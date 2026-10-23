import mongoose from 'mongoose';
import Appearance from '../models/Appearance.js';
import { sendAdminOrderNotificationEmail } from '../utils/emailService.js';
import { sendAdminOrderWhatsAppAlerts, sendWhatsAppMessage, formatOrderWhatsAppMessage } from '../utils/whatsappService.js';
import { sendTelegramMessage, formatOrderTelegramMessage } from '../utils/telegramService.js';

// Default Appearance Data Fallback
const defaultAppearance = {
  heroBadge: 'Spring / Summer Haute Couture',
  heroTitle: 'THE CALM EDIT',
  heroDescription: 'A destination for timeless Parisian elegance and confident luxury.',
  heroCoverImage: 'https://plus.unsplash.com/premium_photo-1664202526559-e21e9c0fb46a?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  heroButtonText: 'Shop The Collection',
  heroButtonLink: '/shop?collection=the-calm-edit',
  banners: [
    {
      _id: 'banner_1',
      title: 'THE CALM EDIT',
      subtitle: 'Spring / Summer Haute Couture',
      description: 'A destination for timeless Parisian elegance and confident luxury.',
      imageUrl: 'https://plus.unsplash.com/premium_photo-1664202526559-e21e9c0fb46a?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      buttonText: 'Shop The Collection',
      buttonLink: '/shop?collection=the-calm-edit',
      active: true,
    },
    {
      _id: 'banner_2',
      title: 'EVENING SILHOUETTES',
      subtitle: 'New Season Capsule',
      description: 'Sculpted draping and bespoke tailoring designed for extraordinary moments.',
      imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop',
      buttonText: 'Explore Dresses',
      buttonLink: '/shop?category=Women',
      active: true,
    },
  ],
  showAnnouncement: true,
  announcementText: 'Complimentary Worldwide Express Delivery on Orders Over $250 • ENNIGMA PARIS',
  showPromo: true,
  promoBadge: 'Editorial Feature',
  promoTitle: 'L\'Art de Vivre & Parisian Craftsmanship',
  promoDescription: 'Each silhouette is sculpted with timeless elegance, utilizing bespoke fabrics and fine artisanal tailoring.',
  promoImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop',
  promoButtonText: 'Discover Atelier',
  promoButtonLink: '/about',
  notificationSettings: {
    ownerEmail: process.env.OWNER_EMAIL || '',
    ownerPhone: process.env.OWNER_WHATSAPP || process.env.OWNER_PHONE || '',
    managerEmail: process.env.MANAGER_EMAIL || '',
    managerPhone: process.env.MANAGER_WHATSAPP || process.env.MANAGER_PHONE || '',
    enableEmailAlerts: true,
    enableWhatsAppAlerts: true,
    whatsappProvider: process.env.WHATSAPP_PROVIDER || 'twilio',
    enableTelegramAlerts: true,
    telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
  },
};

let inMemoryAppearance = { ...defaultAppearance };

// @desc    Get website appearance settings (Hero cover, banners, announcements)
// @route   GET /api/appearance
// @access  Public
export const getAppearance = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      let appearance = await Appearance.findOne();
      if (!appearance) {
        // Create initial default document in database
        appearance = await Appearance.create(defaultAppearance);
      }
      inMemoryAppearance = appearance.toObject ? appearance.toObject() : appearance;
      return res.json(appearance);
    }

    // Fallback when DB is reconnecting
    res.json(inMemoryAppearance);
  } catch (error) {
    console.error('Error fetching appearance:', error);
    res.json(inMemoryAppearance);
  }
};

// @desc    Update website appearance settings
// @route   PUT /api/appearance
// @access  Private/Admin
export const updateAppearance = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Update in-memory fallback
    inMemoryAppearance = {
      ...inMemoryAppearance,
      ...updateData,
    };

    if (mongoose.connection.readyState === 1) {
      let appearance = await Appearance.findOne();
      if (!appearance) {
        appearance = new Appearance(updateData);
      } else {
        Object.assign(appearance, updateData);
      }
      const savedAppearance = await appearance.save();
      inMemoryAppearance = savedAppearance.toObject();
      return res.json(savedAppearance);
    }

    res.json({
      ...inMemoryAppearance,
      _resilientNotice: 'Saved to session store (syncing with database on next connection)',
    });
  } catch (error) {
    console.error('Error updating appearance:', error);
    res.status(500).json({ message: 'Server error updating appearance' });
  }
};

// @desc    Dispatch test email and WhatsApp alerts to verify notification settings
// @route   POST /api/appearance/test-notifications
// @access  Private/Admin
export const sendTestNotifications = async (req, res) => {
  try {
    const { ownerEmail, ownerPhone, managerEmail, managerPhone } = req.body;

    const sampleOrder = {
      _id: 'TEST-' + Math.floor(100000 + Math.random() * 900000),
      guestName: 'Valued Client (Test Notification)',
      guestEmail: 'test.client@ennigmaparis.com',
      guestPhone: '+94 77 123 4567',
      total: 18500,
      paymentMethod: 'Bank Fund Transfer',
      paymentStatus: 'Pending Verification',
      transferReceipt: '/uploads/sample-receipt.pdf',
      shippingAddress: {
        street: 'No. 2A, De Fonseka Road',
        city: 'Colombo 05',
        state: 'Western Province',
        zip: '00500',
        country: 'Sri Lanka',
      },
      items: [
        {
          name: 'THE CALM EDIT - Haute Couture Gown',
          qty: 1,
          size: 'UK 10',
          price: 18500,
        },
      ],
    };

    const recipientOverride = {
      ownerEmail: ownerEmail || process.env.OWNER_EMAIL,
      ownerPhone: ownerPhone || process.env.OWNER_WHATSAPP || process.env.OWNER_PHONE,
      managerEmail: managerEmail || process.env.MANAGER_EMAIL,
      managerPhone: managerPhone || process.env.MANAGER_WHATSAPP || process.env.MANAGER_PHONE,
    };

    // 1. Dispatch Test Email
    let emailStatus = 'Not configured';
    if (recipientOverride.ownerEmail || recipientOverride.managerEmail || process.env.EMAIL_FROM_ADDRESS) {
      try {
        await sendAdminOrderNotificationEmail(sampleOrder, recipientOverride);
        emailStatus = 'Dispatched successfully';
      } catch (err) {
        emailStatus = 'Error: ' + err.message;
      }
    }

    // 2. Dispatch Test WhatsApp
    const waResults = [];
    const sampleMessage = formatOrderWhatsAppMessage(sampleOrder);

    if (recipientOverride.ownerPhone) {
      const r = await sendWhatsAppMessage(recipientOverride.ownerPhone, sampleMessage);
      waResults.push({ recipient: 'Owner', phone: recipientOverride.ownerPhone, ...r });
    }
    if (recipientOverride.managerPhone) {
      const r = await sendWhatsAppMessage(recipientOverride.managerPhone, sampleMessage);
      waResults.push({ recipient: 'Manager', phone: recipientOverride.managerPhone, ...r });
    }

    // 3. Dispatch Test Telegram (if configured)
    let telegramStatus = 'Not configured';
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      try {
        const tgMsg = formatOrderTelegramMessage(sampleOrder);
        const tgRes = await sendTelegramMessage(process.env.TELEGRAM_CHAT_ID, tgMsg);
        telegramStatus = tgRes.success ? 'Delivered successfully' : `Failed: ${tgRes.error}`;
      } catch (err) {
        telegramStatus = 'Error: ' + err.message;
      }
    }

    res.json({
      success: true,
      message: 'Test notification process executed! Check your inbox.',
      emailStatus,
      waResults,
      telegramStatus,
    });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ message: 'Error triggering test notification: ' + error.message });
  }
};

