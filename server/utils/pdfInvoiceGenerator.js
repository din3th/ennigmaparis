import PDFDocument from 'pdfkit';

/**
 * Generate an official ENNIGMA PARIS PDF Invoice / Atelier Receipt
 * Supports both inline preview in browser tabs and forced attachment download
 */
export const generateInvoicePDF = (order, res, isDownload = false) => {
  const doc = new PDFDocument({
    margin: 45,
    size: 'A4',
    info: {
      Title: `Invoice-ENNIGMA-${order._id || order.id}`,
      Author: 'ENNIGMA PARIS',
      Subject: 'Official Atelier Receipt & Tax Invoice',
      Keywords: 'Ennigma, Luxury, Invoice, Receipt',
    },
  });

  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => {
    const pdfBuffer = Buffer.concat(chunks);
    const orderId = String(order._id || order.id || 'RECEIPT');
    const disposition = isDownload ? 'attachment' : 'inline';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename="Invoice-ENNIGMA-${orderId}.pdf"`
    );
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.end(pdfBuffer);
  });

  const orderId = String(order._id || order.id || '');
  const items = order.items || order.orderItems || [];
  const createdAt = new Date(order.createdAt || Date.now());
  const dateFormatted = createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // ==================== HEADER ====================
  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('ENNIGMA PARIS', { align: 'center', characterSpacing: 4 });

  doc
    .fontSize(8)
    .font('Helvetica')
    .fillColor('#666666')
    .text('HAUTE COUTURE & LUXURY READY-TO-WEAR', { align: 'center', characterSpacing: 2 })
    .moveDown(0.3);

  doc
    .fontSize(7.5)
    .font('Helvetica')
    .fillColor('#888888')
    .text(
      'Colombo Flagship Boutique: 2a De Fonseka Rd, Colombo 00500 | +94 76 864 5555 | concierge@ennigmaparis.com',
      { align: 'center' }
    )
    .moveDown(0.8);

  // Black divider line
  doc
    .strokeColor('#111111')
    .lineWidth(1)
    .moveTo(45, doc.y)
    .lineTo(550, doc.y)
    .stroke();

  doc.moveDown(1);

  // ==================== METADATA & CUSTOMER INFO ====================
  const metaTop = doc.y;

  // Left Column - Customer & Shipping Details
  doc.fillColor('#111111');
  doc.fontSize(8.5).font('Helvetica-Bold').text('BILLED & SHIPPED TO:', 45, metaTop);
  
  const customerName = order.guestName || (order.user && order.user.name) || 'Valued Client';
  const customerEmail = order.guestEmail || (order.user && order.user.email) || '';
  const customerPhone = order.guestPhone || (order.user && order.user.phone) || '';

  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica-Bold').text(customerName, 45);
  doc.fontSize(8.5).font('Helvetica').fillColor('#444444');
  if (customerEmail) doc.text(customerEmail, 45);
  if (customerPhone) doc.text(customerPhone, 45);

  if (order.shippingAddress) {
    const { street, city, state, zip, country } = order.shippingAddress;
    if (street) doc.text(street, 45);
    const locality = [city, state, zip].filter(Boolean).join(', ');
    if (locality) doc.text(locality, 45);
    if (country) doc.text(country, 45);
  }

  // Right Column - Invoice Metadata
  const rightColX = 350;
  doc.fillColor('#111111');
  doc.fontSize(8.5).font('Helvetica-Bold').text('INVOICE DETAILS:', rightColX, metaTop);
  doc.moveDown(0.3);

  doc.fontSize(8.5).font('Helvetica-Bold').text('Invoice No: ', rightColX, doc.y, { continued: true });
  doc.font('Helvetica').text(`#${orderId}`);

  doc.font('Helvetica-Bold').text('Order Date: ', rightColX, doc.y, { continued: true });
  doc.font('Helvetica').text(dateFormatted);

  doc.font('Helvetica-Bold').text('Payment Method: ', rightColX, doc.y, { continued: true });
  doc.font('Helvetica').text(`${order.paymentMethod || 'COD'}`);

  doc.font('Helvetica-Bold').text('Payment Status: ', rightColX, doc.y, { continued: true });
  doc.font('Helvetica').fillColor(order.paymentStatus === 'Completed' ? '#166534' : '#854d0e').text(`${order.paymentStatus || 'Pending'}`);

  doc.fillColor('#111111');
  doc.font('Helvetica-Bold').text('Fulfillment: ', rightColX, doc.y, { continued: true });
  doc.font('Helvetica').text(`${order.orderStatus || 'Confirmed'}`);

  // Position below metadata block
  doc.y = Math.max(doc.y, metaTop + 95);
  doc.moveDown(1);

  // ==================== ITEMS TABLE ====================
  const tableTop = doc.y;

  // Header background
  doc.rect(45, tableTop, 505, 20).fill('#f9f9f9');
  doc.fillColor('#111111');
  doc.fontSize(8).font('Helvetica-Bold');
  doc.text('ITEM DESCRIPTION', 55, tableTop + 6);
  doc.text('SIZE', 270, tableTop + 6);
  doc.text('QTY', 340, tableTop + 6);
  doc.text('UNIT PRICE', 390, tableTop + 6);
  doc.text('TOTAL', 480, tableTop + 6, { width: 60, align: 'right' });

  // Border below table header
  doc.strokeColor('#e5e5e5').lineWidth(0.5).moveTo(45, tableTop + 20).lineTo(550, tableTop + 20).stroke();

  let position = tableTop + 28;
  doc.font('Helvetica').fontSize(8.5);

  items.forEach((item, index) => {
    doc.fillColor('#111111');
    doc.font('Helvetica-Bold').text(item.name || 'Luxury Fashion Item', 55, position, { width: 205 });
    doc.font('Helvetica').fillColor('#666666');
    doc.text(item.size || 'M', 270, position);
    doc.text(String(item.qty || 1), 340, position);
    
    const unitPrice = item.price || 0;
    const itemTotal = unitPrice * (item.qty || 1);

    doc.fillColor('#111111');
    doc.text(`LKR ${unitPrice.toLocaleString('en-US')}`, 390, position);
    doc.text(`LKR ${itemTotal.toLocaleString('en-US')}`, 480, position, { width: 60, align: 'right' });

    position += 24;
    // Row separator
    doc.strokeColor('#f0f0f0').lineWidth(0.5).moveTo(45, position - 4).lineTo(550, position - 4).stroke();
  });

  position += 8;

  // ==================== SUMMARY TOTALS ====================
  const summaryX = 350;
  doc.fontSize(8.5);

  const subtotal = order.itemsPrice || (order.total - (order.shippingPrice || 0) + (order.discountAmount || 0));
  doc.font('Helvetica').fillColor('#666666').text('Subtotal:', summaryX, position);
  doc.font('Helvetica').fillColor('#111111').text(`LKR ${(subtotal || 0).toLocaleString('en-US')}`, 450, position, { width: 90, align: 'right' });
  position += 16;

  if (order.discountAmount && order.discountAmount > 0) {
    doc.font('Helvetica').fillColor('#15803d').text(`Discount (${order.discountCode || 'PROMO'}):`, summaryX, position);
    doc.text(`- LKR ${(order.discountAmount || 0).toLocaleString('en-US')}`, 450, position, { width: 90, align: 'right' });
    position += 16;
  }

  doc.font('Helvetica').fillColor('#666666').text('Shipping & Delivery:', summaryX, position);
  const shippingText = (order.shippingPrice && order.shippingPrice > 0) ? `LKR ${order.shippingPrice.toLocaleString('en-US')}` : 'Complimentary';
  doc.font('Helvetica').fillColor('#111111').text(shippingText, 450, position, { width: 90, align: 'right' });
  position += 18;

  // Total line
  doc.strokeColor('#111111').lineWidth(1).moveTo(summaryX, position - 4).lineTo(550, position - 4).stroke();
  doc.font('Helvetica-Bold').fontSize(10.5).fillColor('#000000').text('Total Amount:', summaryX, position);
  doc.text(`LKR ${(order.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 450, position, { width: 90, align: 'right' });

  // ==================== LUXURY FOOTER ====================
  const footerY = Math.min(Math.max(position + 30, 620), 710);
  doc.y = footerY;
  doc
    .strokeColor('#e5e5e5')
    .lineWidth(0.5)
    .moveTo(45, footerY)
    .lineTo(550, footerY)
    .stroke();

  doc.y = footerY + 10;
  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor('#111111')
    .text('ENNIGMA PARIS CLIENT SERVICES', 45, doc.y, { align: 'center' });

  doc.y = doc.y + 4;
  doc
    .fontSize(7.5)
    .font('Helvetica')
    .fillColor('#777777')
    .text(
      'Thank you for selecting ENNIGMA PARIS. Every piece is handcrafted with precision and discerning standards.\nFor bespoke styling, complimentary size exchanges, or atelier inquiries, contact concierge@ennigmaparis.com.',
      45,
      doc.y,
      { align: 'center', lineGap: 2 }
    );

  doc.end();
};
