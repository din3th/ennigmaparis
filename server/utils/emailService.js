import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

const getTransporter = async () => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    if (smtpHost.includes('gmail')) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: { user: smtpUser, pass: smtpPass.replace(/\s+/g, '') },
      });
    } else {
      return nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: smtpUser, pass: smtpPass },
      });
    }
  } else {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  }
};

export const sendOrderConfirmationEmail = async (order) => {
  const recipientEmail = order.guestEmail || (order.user && order.user.email);

  if (!recipientEmail) {
    console.log('No recipient email provided for order confirmation.');
    return;
  }

  const attachments = [];

  const itemsListHtml = order.items.map((item, index) => {
    let imgSrc = item.image || '';

    if (imgSrc) {
      // Clean domain if present (e.g., http://localhost:3001/uploads/img.jpg -> /uploads/img.jpg)
      const cleanImgPath = imgSrc.replace(/^[a-zA-Z]+:\/\/[^/]+/, '');
      const filename = path.basename(cleanImgPath);

      // Check potential paths on server
      const possiblePaths = [
        path.join(process.cwd(), 'uploads', filename),
        path.join(process.cwd(), 'public', filename),
        path.join(process.cwd(), cleanImgPath.replace(/^\//, ''))
      ];

      const foundPath = possiblePaths.find(p => fs.existsSync(p));

      if (foundPath) {
        const cidName = `item_img_${index}_${Date.now()}`;
        attachments.push({
          filename: filename,
          path: foundPath,
          cid: cidName
        });
        imgSrc = `cid:${cidName}`;
      } else if (!imgSrc.startsWith('http://') && !imgSrc.startsWith('https://')) {
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
        imgSrc = `${baseUrl}${imgSrc.startsWith('/') ? '' : '/'}${imgSrc}`;
      }
    }

    return `
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 12px 0;">
          ${imgSrc ? `<img src="${imgSrc}" alt="${item.name}" style="width: 60px; height: 75px; object-fit: cover; border-radius: 2px; display: block;" />` : ''}
        </td>
        <td style="padding: 12px; font-family: 'Helvetica Neue', sans-serif; font-size: 13px; color: #111;">
          <strong style="text-transform: uppercase;">${item.name}</strong><br/>
          <span style="color: #666; font-size: 11px;">Size: ${item.size || 'Standard'} | Qty: ${item.qty}</span>
        </td>
        <td style="padding: 12px 0; font-family: 'Helvetica Neue', sans-serif; font-size: 13px; font-weight: bold; text-align: right; color: #111;">
          LKR ${(item.price * item.qty).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </td>
      </tr>
    `;
  }).join('');


  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation - ENNIGMA PARIS</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: 'Georgia', serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f9f9f9; padding: 40px 10px;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 1px solid #eaeaea; padding: 40px;">
              <tr>
                <td align="center" style="padding-bottom: 30px; border-bottom: 1px solid #eee;">
                  <h1 style="font-size: 26px; font-weight: normal; letter-spacing: 4px; text-transform: uppercase; margin: 0; color: #000;">
                    ENNIGMA PARIS
                  </h1>
                  <p style="font-family: 'Helvetica Neue', sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #888; margin-top: 8px;">
                    Order Confirmation
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px 0 20px 0; font-family: 'Helvetica Neue', sans-serif; font-size: 14px; color: #333; line-height: 1.6;">
                  Dear <strong>${order.guestName || 'Valued Customer'}</strong>,<br/><br/>
                  Thank you for your order with <strong>ENNIGMA PARIS</strong>. We are preparing your order with meticulous care.
                </td>
              </tr>
              <tr>
                <td style="background-color: #fafafa; padding: 15px; border-radius: 2px; margin-bottom: 20px;">
                  <p style="font-family: 'Helvetica Neue', sans-serif; font-size: 12px; color: #555; margin: 0 0 5px 0;">
                    <strong>Order Reference:</strong> #${order._id || order.id}
                  </p>
                  <p style="font-family: 'Helvetica Neue', sans-serif; font-size: 12px; color: #555; margin: 0;">
                    <strong>Payment Method:</strong> ${order.paymentMethod} (${order.paymentStatus || 'Pending'})
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding-top: 20px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <thead>
                      <tr style="border-bottom: 2px solid #111;">
                        <th align="left" style="padding-bottom: 8px; font-family: 'Helvetica Neue', sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888;">Item</th>
                        <th align="left" style="padding-bottom: 8px; padding-left: 12px; font-family: 'Helvetica Neue', sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888;">Details</th>
                        <th align="right" style="padding-bottom: 8px; font-family: 'Helvetica Neue', sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888;">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsListHtml}
                    </tbody>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding-top: 20px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td align="right" style="font-family: 'Helvetica Neue', sans-serif; font-size: 13px; color: #666; padding: 4px 0;">
                        Subtotal: <strong>LKR ${(order.itemsPrice || order.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                      </td>
                    </tr>
                    ${order.discountAmount ? `
                    <tr>
                      <td align="right" style="font-family: 'Helvetica Neue', sans-serif; font-size: 13px; color: #2e7d32; padding: 4px 0;">
                        Discount (${order.discountCode}): <strong>-LKR ${order.discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                      </td>
                    </tr>
                    ` : ''}
                    <tr>
                      <td align="right" style="font-family: 'Helvetica Neue', sans-serif; font-size: 16px; font-weight: bold; color: #000; padding: 12px 0 0 0; border-top: 1px solid #111;">
                        Total: LKR ${(order.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding-top: 30px; border-top: 1px solid #eee; margin-top: 30px;">
                  <h3 style="font-family: 'Helvetica Neue', sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #111; margin: 0 0 10px 0;">
                    Shipping Address
                  </h3>
                  <p style="font-family: 'Helvetica Neue', sans-serif; font-size: 12px; color: #666; line-height: 1.5; margin: 0;">
                    ${order.shippingAddress?.street || ''}<br/>
                    ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.zip || ''}<br/>
                    ${order.shippingAddress?.country || 'Sri Lanka'}
                  </p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top: 40px; border-top: 1px solid #eee; margin-top: 40px; font-family: 'Helvetica Neue', sans-serif; font-size: 11px; color: #aaa;">
                  <p style="margin: 0 0 5px 0;">ENNIGMA PARIS • Colombo Atelier</p>
                  <p style="margin: 0;">If you have any questions, reply directly to this email or contact support.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'ENNIGMA PARIS'}" <${process.env.EMAIL_FROM_ADDRESS || 'fourthpeerson@gmail.com'}>`,
      to: recipientEmail,
      subject: `Order Confirmation #${order._id || order.id} - ENNIGMA PARIS`,
      html: emailHtml,
      attachments: attachments,
    });

    console.log(`✅ Order confirmation email dispatched to ${recipientEmail}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) console.log(`✉️ VIEW SENT EMAIL ONLINE: ${previewUrl}`);
  } catch (error) {
    console.error('Failed to send order confirmation email:', error.message);
  }
};

export const sendWelcomeEmail = async (user) => {
  if (!user || !user.email) return;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to ENNIGMA PARIS</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: 'Georgia', serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f9f9f9; padding: 40px 10px;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 1px solid #eaeaea; padding: 40px;">
              <tr>
                <td align="center" style="padding-bottom: 30px; border-bottom: 1px solid #eee;">
                  <h1 style="font-size: 26px; font-weight: normal; letter-spacing: 4px; text-transform: uppercase; margin: 0; color: #000;">
                    ENNIGMA PARIS
                  </h1>
                  <p style="font-family: 'Helvetica Neue', sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #888; margin-top: 8px;">
                    Welcome to the Maison
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px 0 20px 0; font-family: 'Helvetica Neue', sans-serif; font-size: 14px; color: #333; line-height: 1.6;">
                  Dear <strong>${user.name || 'Valued Member'}</strong>,<br/><br/>
                  Welcome to <strong>ENNIGMA PARIS</strong>. Your customer account has been created successfully.<br/><br/>
                  You can now sign in to view your orders, save items to your personal wishlist, and enjoy express checkout.
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 20px 0;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/shop" style="background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 30px; font-family: 'Helvetica Neue', sans-serif; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; display: inline-block;">
                    Explore The Collection
                  </a>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-top: 40px; border-top: 1px solid #eee; margin-top: 40px; font-family: 'Helvetica Neue', sans-serif; font-size: 11px; color: #aaa;">
                  <p style="margin: 0 0 5px 0;">ENNIGMA PARIS • Colombo Atelier</p>
                  <p style="margin: 0;">If you did not request this account, please contact support.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'ENNIGMA PARIS'}" <${process.env.EMAIL_FROM_ADDRESS || 'fourthpeerson@gmail.com'}>`,
      to: user.email,
      subject: `Welcome to ENNIGMA PARIS, ${user.name}`,
      html: emailHtml,
    });

    console.log(`✅ Welcome email dispatched to ${user.email}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) console.log(`✉️ VIEW SENT WELCOME EMAIL ONLINE: ${previewUrl}`);
  } catch (error) {
    console.error('Failed to send welcome email:', error.message);
  }
};

export const sendBackInStockEmail = async (email, product) => {
  if (!email || !product) return;

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Back in Stock - ENNIGMA PARIS</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: 'Georgia', serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f9f9f9; padding: 40px 10px;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 1px solid #eaeaea; padding: 40px;">
              <tr>
                <td align="center" style="padding-bottom: 30px; border-bottom: 1px solid #eee;">
                  <h1 style="font-size: 26px; font-weight: normal; letter-spacing: 4px; text-transform: uppercase; margin: 0; color: #000;">
                    ENNIGMA PARIS
                  </h1>
                  <p style="font-family: 'Helvetica Neue', sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #888; margin-top: 8px;">
                    Back In Stock Alert
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px 0 20px 0; font-family: 'Helvetica Neue', sans-serif; font-size: 14px; color: #333; line-height: 1.6;">
                  Good news! The item you requested, <strong>${product.name}</strong>, is now back in stock.<br/><br/>
                  Quantities are limited in our atelier. Complete your purchase now to secure your piece.
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 20px 0;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/product/${product.slug || product._id}" style="background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 30px; font-family: 'Helvetica Neue', sans-serif; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; display: inline-block;">
                    View Product & Shop
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const transporter = await getTransporter();
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'ENNIGMA PARIS'}" <${process.env.EMAIL_FROM_ADDRESS || 'fourthpeerson@gmail.com'}>`,
      to: email,
      subject: `Back in Stock: ${product.name} - ENNIGMA PARIS`,
      html: emailHtml,
    });
    console.log(`✅ Back in stock alert sent to ${email}`);
  } catch (error) {
    console.error('Failed to send back in stock email:', error.message);
  }
};

/**
 * Dispatches high-priority order notification email to Owner & Manager
 */
export const sendAdminOrderNotificationEmail = async (order, recipientsOverride = {}) => {
  const ownerEmail = recipientsOverride.ownerEmail || process.env.OWNER_EMAIL;
  const managerEmail = recipientsOverride.managerEmail || process.env.MANAGER_EMAIL;

  const recipientList = [ownerEmail, managerEmail].filter(Boolean);
  if (recipientList.length === 0 && process.env.EMAIL_FROM_ADDRESS) {
    recipientList.push(process.env.EMAIL_FROM_ADDRESS);
  }

  if (recipientList.length === 0) {
    console.log('[Admin Email Notification] Skipped: No owner or manager email defined.');
    return;
  }

  const customerName = order.guestName || (order.user && order.user.name) || 'Guest Customer';
  const customerEmail = order.guestEmail || (order.user && order.user.email) || 'Not provided';
  const customerPhone = order.guestPhone || (order.user && order.user.phone) || 'Not provided';
  const totalFormatted = Number(order.total || order.totalPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
  const paymentMethod = order.paymentMethod || 'COD';
  const paymentStatus = order.paymentStatus || 'Pending';
  const adminUrl = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/admin/orders`;

  const address = order.shippingAddress || {};
  const addressFormatted = `${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.zip || ''}, ${address.country || ''}`.replace(/^[\s,]+|[\s,]+$/g, '');

  const itemsHtml = (order.items || []).map((item, idx) => `
    <tr style="border-bottom: 1px solid #eeeeee;">
      <td style="padding: 10px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #111;">
        <strong>${idx + 1}. ${item.name}</strong><br/>
        <span style="color: #666; font-size: 11px;">Size: ${item.size || 'Standard'} | Qty: ${item.qty}</span>
      </td>
      <td style="padding: 10px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; font-weight: bold; text-align: right; color: #111;">
        LKR ${(item.price * item.qty).toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </td>
    </tr>
  `).join('');

  const receiptHtml = order.transferReceipt ? `
    <div style="background-color: #fff8e1; border: 1px solid #ffe082; padding: 12px 16px; border-radius: 4px; margin-top: 20px;">
      <strong style="color: #f57f17; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Bank Fund Transfer Receipt Attached</strong>
      <p style="margin: 4px 0 8px 0; font-size: 12px; color: #555;">The customer has submitted their bank deposit/transfer slip.</p>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}${order.transferReceipt}" target="_blank" style="display: inline-block; background-color: #f57f17; color: #fff; text-decoration: none; padding: 6px 14px; font-size: 11px; font-weight: bold; text-transform: uppercase; border-radius: 2px;">
        View Transfer Confirmation
      </a>
    </div>
  ` : '';

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Order Alert - ENNIGMA PARIS</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 30px 10px;">
        <tr>
          <td align="center">
            <table width="620" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 6px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
              <!-- Header -->
              <tr>
                <td style="background-color: #000000; padding: 25px 30px; text-align: center;">
                  <span style="background-color: #ef4444; color: #ffffff; padding: 3px 8px; font-size: 10px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; border-radius: 3px; display: inline-block; margin-bottom: 8px;">
                    EXECUTIVE ORDER ALERT
                  </span>
                  <h1 style="color: #ffffff; font-family: 'Georgia', serif; font-size: 22px; font-weight: normal; letter-spacing: 3px; text-transform: uppercase; margin: 0;">
                    ENNIGMA PARIS
                  </h1>
                </td>
              </tr>

              <!-- Alert Body -->
              <tr>
                <td style="padding: 30px;">
                  <div style="border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px;">
                    <h2 style="font-size: 18px; margin: 0; color: #111; text-transform: uppercase; letter-spacing: 1px;">
                      New Order Placed: #${order._id || order.id}
                    </h2>
                    <p style="margin: 4px 0 0 0; color: #666; font-size: 12px;">
                      Total: <strong style="color: #000; font-size: 15px;">LKR ${totalFormatted}</strong> • Payment: <strong>${paymentMethod} (${paymentStatus})</strong>
                    </p>
                  </div>

                  <!-- Customer Details -->
                  <table width="100%" style="background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 4px; padding: 14px; margin-bottom: 20px;">
                    <tr>
                      <td style="font-size: 12px; line-height: 1.8; color: #374151;">
                        <strong>Customer Name:</strong> ${customerName}<br/>
                        <strong>Phone:</strong> <a href="tel:${customerPhone}" style="color: #2563eb; text-decoration: none;">${customerPhone}</a><br/>
                        <strong>Email:</strong> <a href="mailto:${customerEmail}" style="color: #2563eb; text-decoration: none;">${customerEmail}</a><br/>
                        <strong>Shipping Address:</strong> ${addressFormatted || 'Not specified'}
                      </td>
                    </tr>
                  </table>

                  <!-- Order Items -->
                  <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin: 15px 0 8px 0;">
                    Purchased Items (${order.items?.length || 0})
                  </h3>
                  <table width="100%" style="border-collapse: collapse; margin-bottom: 20px;">
                    ${itemsHtml}
                    <tr>
                      <td style="padding: 12px 0; font-weight: bold; font-size: 14px; color: #000;">
                        TOTAL AMOUNT
                      </td>
                      <td style="padding: 12px 0; font-weight: bold; font-size: 16px; text-align: right; color: #000;">
                        LKR ${totalFormatted}
                      </td>
                    </tr>
                  </table>

                  ${receiptHtml}

                  <!-- CTA Button -->
                  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <a href="${adminUrl}" style="background-color: #000000; color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; display: inline-block; border-radius: 2px;">
                      Open Order In Admin Panel
                    </a>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 15px 30px; text-align: center; font-size: 11px; color: #9ca3af;">
                  Automated notification sent to System Owner & Manager • ENNIGMA Paris Maison
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const transporter = await getTransporter();
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'ENNIGMA PARIS'}" <${process.env.EMAIL_FROM_ADDRESS || 'fourthpeerson@gmail.com'}>`,
      to: recipientList.join(', '),
      subject: `🚨 [NEW ORDER] #${order._id || order.id} (LKR ${totalFormatted}) - ${customerName}`,
      html: emailHtml,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Admin order notification email sent to [${recipientList.join(', ')}]`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) console.log(`✉️ VIEW ADMIN EMAIL ONLINE: ${previewUrl}`);
  } catch (err) {
    console.error('Failed to send admin order notification email:', err.message);
  }
};


