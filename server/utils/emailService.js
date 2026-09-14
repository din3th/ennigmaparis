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
