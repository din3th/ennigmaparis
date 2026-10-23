/**
 * Formats a clean, luxury e-commerce order notification message for WhatsApp
 */
export const formatOrderWhatsAppMessage = (order) => {
  const customerName = order.guestName || (order.user && order.user.name) || 'Valued Customer';
  const customerPhone = order.guestPhone || (order.user && order.user.phone) || 'Not provided';
  const customerEmail = order.guestEmail || (order.user && order.user.email) || 'Not provided';
  const orderId = order._id || order.id || 'N/A';
  const total = Number(order.total || order.totalPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
  const paymentMethod = order.paymentMethod || 'COD';
  const paymentStatus = order.paymentStatus || 'Pending';
  const dateStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Colombo', dateStyle: 'medium', timeStyle: 'short' });

  let itemsList = '';
  if (Array.isArray(order.items)) {
    itemsList = order.items
      .map((item, idx) => `  ${idx + 1}. *${item.name}* (Size: ${item.size || 'Std'}) x ${item.qty} - LKR ${(item.price * item.qty).toLocaleString('en-US')}`)
      .join('\n');
  }

  const address = order.shippingAddress;
  const addressStr = address
    ? `${address.street || ''}, ${address.city || ''}, ${address.state || ''}`.replace(/^, |, $/g, '')
    : 'Not provided';

  const receiptNotice = order.transferReceipt ? `\n📎 *Bank Receipt:* Uploaded (Ready for verification in Admin)` : '';

  return `🛍️ *NEW ORDER ALERT - ENNIGMA PARIS*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `*Order ID:* #${orderId}\n` +
    `*Date:* ${dateStr}\n` +
    `*Total Amount:* LKR ${total}\n` +
    `*Payment Method:* ${paymentMethod} (${paymentStatus})\n` +
    `${receiptNotice}\n` +
    `👤 *CUSTOMER DETAILS:*\n` +
    `• Name: ${customerName}\n` +
    `• Phone: ${customerPhone}\n` +
    `• Email: ${customerEmail}\n\n` +
    `📍 *SHIPPING ADDRESS:*\n` +
    `• ${addressStr}\n\n` +
    `📦 *ORDER ITEMS:*\n` +
    `${itemsList}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🔗 *Admin Order Management:* ${(process.env.FRONTEND_URL || 'http://localhost:5174')}/admin/orders`;
};

/**
 * Normalizes phone numbers for WhatsApp (removes +, spaces, dashes, leading 0s for Sri Lanka/international)
 */
export const cleanPhoneNumber = (phone) => {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9]/g, '');
  // If Sri Lankan number starts with 0 (e.g. 0771234567), replace 0 with 94
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '94' + cleaned.substring(1);
  }
  return cleaned;
};

/**
 * Sends automated WhatsApp message to a specific phone number using configured provider or returns fallback link
 */
export const sendWhatsAppMessage = async (toPhone, messageText) => {
  const cleanedPhone = cleanPhoneNumber(toPhone);
  if (!cleanedPhone) {
    console.warn('[WhatsApp] Skipped: Invalid or empty recipient phone number.');
    return { success: false, message: 'Invalid phone number' };
  }

  const provider = (process.env.WHATSAPP_PROVIDER || 'twilio').toLowerCase();

  // 1. Twilio WhatsApp API
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886'; // Twilio default sandbox or approved sender

  if (twilioSid && twilioToken && (provider === 'twilio' || !process.env.WHATSAPP_PROVIDER)) {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const params = new URLSearchParams();
      params.append('From', twilioFrom.startsWith('whatsapp:') ? twilioFrom : `whatsapp:${twilioFrom}`);
      params.append('To', `whatsapp:+${cleanedPhone}`);
      params.append('Body', messageText);

      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`[WhatsApp - Twilio] Message dispatched to +${cleanedPhone} (SID: ${data.sid})`);
        return { success: true, sid: data.sid, provider: 'twilio' };
      } else {
        console.error(`[WhatsApp - Twilio Error] Failed to send to +${cleanedPhone}:`, data.message);
      }
    } catch (err) {
      console.error(`[WhatsApp - Twilio Error] Failed to send to +${cleanedPhone}:`, err.message);
    }
  }

  // 2. UltraMsg WhatsApp API
  const ultraMsgInstance = process.env.ULTRAMSG_INSTANCE_ID;
  const ultraMsgToken = process.env.ULTRAMSG_TOKEN;

  if (ultraMsgInstance && ultraMsgToken && (provider === 'ultramsg' || !process.env.TWILIO_ACCOUNT_SID)) {
    try {
      const url = `https://api.ultramsg.com/${ultraMsgInstance}/messages/chat`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: ultraMsgToken,
          to: cleanedPhone,
          body: messageText,
        }),
      });

      const data = await response.json();
      console.log(`[WhatsApp - UltraMsg] Message dispatched to +${cleanedPhone}`);
      return { success: true, response: data, provider: 'ultramsg' };
    } catch (err) {
      console.error(`[WhatsApp - UltraMsg Error] Failed to send to +${cleanedPhone}:`, err.message);
    }
  }

  // 3. Wassenger WhatsApp API (Top Recommendation: https://wassenger.com)
  const wassengerKey = process.env.WASSENGER_API_KEY || process.env.WASSENGER_TOKEN;
  if (wassengerKey && (provider === 'wassenger' || !process.env.TWILIO_ACCOUNT_SID)) {
    try {
      const response = await fetch('https://api.wassenger.com/v1/messages', {
        method: 'POST',
        headers: {
          'Token': wassengerKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: `+${cleanedPhone}`,
          message: messageText,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`[WhatsApp - Wassenger] Message dispatched to +${cleanedPhone}`);
        return { success: true, response: data, provider: 'wassenger' };
      } else {
        console.error(`[WhatsApp - Wassenger Error]:`, data.message || data);
      }
    } catch (err) {
      console.error(`[WhatsApp - Wassenger Error]:`, err.message);
    }
  }

  // 4. Green API (https://green-api.com)
  const greenApiId = process.env.GREEN_API_ID_INSTANCE || process.env.GREEN_API_INSTANCE;
  const greenApiToken = process.env.GREEN_API_TOKEN;
  if (greenApiId && greenApiToken && (provider === 'greenapi' || !process.env.TWILIO_ACCOUNT_SID)) {
    try {
      const url = `https://api.green-api.com/waInstance${greenApiId}/sendMessage/${greenApiToken}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: `${cleanedPhone}@c.us`,
          message: messageText,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`[WhatsApp - Green API] Message dispatched to +${cleanedPhone} (ID: ${data.idMessage})`);
        return { success: true, response: data, provider: 'greenapi' };
      }
    } catch (err) {
      console.error(`[WhatsApp - Green API Error]:`, err.message);
    }
  }

  // 5. CallMeBot WhatsApp API (100% Free Personal WhatsApp Gateway)
  const callMeBotKey = process.env.CALLMEBOT_API_KEY || process.env.CALLMEBOT_KEY;
  if (callMeBotKey) {
    try {
      const encodedMsg = encodeURIComponent(messageText);
      const url = `https://api.callmebot.com/whatsapp.php?phone=+${cleanedPhone}&text=${encodedMsg}&apikey=${callMeBotKey}`;
      const response = await fetch(url, { method: 'GET' });
      const responseText = await response.text();

      if (response.ok && (responseText.includes('success') || responseText.includes('Message queued') || responseText.includes('Message Sent'))) {
        console.log(`[WhatsApp - CallMeBot] Message delivered directly to +${cleanedPhone}`);
        return { success: true, provider: 'callmebot', response: responseText };
      } else {
        console.warn(`[WhatsApp - CallMeBot Response]:`, responseText);
      }
    } catch (err) {
      console.error(`[WhatsApp - CallMeBot Error] Failed to send to +${cleanedPhone}:`, err.message);
    }
  }

  // 3. Fallback / Click-to-Chat deep link generator
  const clickToChatUrl = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(messageText)}`;
  console.log(`\n📱 [WhatsApp Alert Generated for +${cleanedPhone}]`);
  console.log(`➡️ Click-to-Open URL: ${clickToChatUrl}\n`);

  return {
    success: true,
    fallback: true,
    waLink: clickToChatUrl,
    message: 'Generated WhatsApp click-to-chat link (add TWILIO or ULTRAMSG credentials to .env for automated background delivery)',
  };
};

/**
 * Dispatches WhatsApp notifications to Owner & Manager
 */
export const sendAdminOrderWhatsAppAlerts = async (order, recipientsOverride = {}) => {
  try {
    const ownerPhone = recipientsOverride.ownerPhone || process.env.OWNER_WHATSAPP || process.env.OWNER_PHONE;
    const managerPhone = recipientsOverride.managerPhone || process.env.MANAGER_WHATSAPP || process.env.MANAGER_PHONE;

    const phonesToSend = [
      { role: 'Owner', phone: ownerPhone },
      { role: 'Manager', phone: managerPhone },
    ].filter(item => Boolean(item.phone));

    if (phonesToSend.length === 0) {
      console.log('[WhatsApp Notification] Notice: No OWNER_PHONE or MANAGER_PHONE configured yet in settings/.env');
      return;
    }

    const message = formatOrderWhatsAppMessage(order);

    const dispatchPromises = phonesToSend.map(async ({ role, phone }) => {
      console.log(`[WhatsApp Notification] Dispatching order alert to ${role} (${phone})...`);
      return sendWhatsAppMessage(phone, message);
    });

    await Promise.allSettled(dispatchPromises);
  } catch (error) {
    console.error('[WhatsApp Notification Error]:', error.message);
  }
};
