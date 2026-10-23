/**
 * Telegram Notification Service for Ennigma Paris
 * 100% Free, Official, Instant push notifications to Owner/Manager
 */

export const formatOrderTelegramMessage = (order) => {
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
      .map((item, idx) => `  ${idx + 1}. <b>${item.name}</b> (Size: ${item.size || 'Std'}) x ${item.qty} - LKR ${(item.price * item.qty).toLocaleString('en-US')}`)
      .join('\n');
  }

  const address = order.shippingAddress;
  const addressStr = address
    ? `${address.street || ''}, ${address.city || ''}, ${address.state || ''}`.replace(/^, |, $/g, '')
    : 'Not provided';

  const receiptNotice = order.transferReceipt ? `\n📎 <b>Bank Receipt:</b> Uploaded (Ready for verification in Admin)` : '';

  return `🛍️ <b>NEW ORDER ALERT - ENNIGMA PARIS</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `<b>Order ID:</b> #${orderId}\n` +
    `<b>Date:</b> ${dateStr}\n` +
    `<b>Total:</b> LKR ${total}\n` +
    `<b>Payment:</b> ${paymentMethod} (${paymentStatus})\n` +
    `${receiptNotice}\n` +
    `👤 <b>CUSTOMER DETAILS:</b>\n` +
    `• Name: ${customerName}\n` +
    `• Phone: ${customerPhone}\n` +
    `• Email: ${customerEmail}\n\n` +
    `📍 <b>SHIPPING ADDRESS:</b>\n` +
    `• ${addressStr}\n\n` +
    `📦 <b>ITEMS:</b>\n` +
    `${itemsList}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `<a href="${(process.env.FRONTEND_URL || 'http://localhost:5174')}/admin/orders">🔗 View Order in Admin Panel</a>`;
};

export const sendTelegramMessage = async (chatId, messageText) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const targetChatId = chatId || process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !targetChatId) {
    return { success: false, message: 'Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID' };
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: messageText,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      }),
    });

    const data = await response.json();
    if (data.ok) {
      console.log(`[Telegram] Order alert delivered to chat ID ${targetChatId}`);
      return { success: true, messageId: data.result.message_id };
    } else {
      console.error('[Telegram Error]:', data.description);
      return { success: false, error: data.description };
    }
  } catch (error) {
    console.error('[Telegram Network Error]:', error.message);
    return { success: false, error: error.message };
  }
};

export const sendAdminOrderTelegramAlert = async (order) => {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    return;
  }
  const message = formatOrderTelegramMessage(order);
  return sendTelegramMessage(process.env.TELEGRAM_CHAT_ID, message);
};
