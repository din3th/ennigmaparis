import PDFDocument from 'pdfkit';

export const generateInvoicePDF = (order, res) => {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=Invoice-ENNIGMA-${order._id || order.id}.pdf`
  );

  doc.pipe(res);

  // Header
  doc
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('ENNIGMA PARIS', { align: 'center', characterSpacing: 3 })
    .moveDown(0.2);

  doc
    .fontSize(10)
    .font('Helvetica')
    .text('INVOICE / RECEIPT', { align: 'center', characterSpacing: 2 })
    .moveDown(1.5);

  // Order & Customer Details
  doc.fontSize(10).font('Helvetica-Bold').text(`Order ID: `, { continued: true }).font('Helvetica').text(`#${order._id || order.id}`);
  doc.fontSize(10).font('Helvetica-Bold').text(`Date: `, { continued: true }).font('Helvetica').text(new Date(order.createdAt || Date.now()).toLocaleDateString());
  doc.fontSize(10).font('Helvetica-Bold').text(`Payment Method: `, { continued: true }).font('Helvetica').text(`${order.paymentMethod || 'N/A'} (${order.paymentStatus || 'Pending'})`);
  doc.fontSize(10).font('Helvetica-Bold').text(`Order Status: `, { continued: true }).font('Helvetica').text(`${order.orderStatus || 'Pending'}`);
  doc.moveDown(1);

  // Shipping Address
  doc.font('Helvetica-Bold').text('Billed & Shipped To:');
  doc.font('Helvetica').text(order.guestName || (order.user && order.user.name) || 'Valued Customer');
  if (order.shippingAddress) {
    if (order.shippingAddress.street) doc.text(order.shippingAddress.street);
    if (order.shippingAddress.city) doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state || ''} ${order.shippingAddress.zip || ''}`);
    if (order.shippingAddress.country) doc.text(order.shippingAddress.country);
  }
  doc.moveDown(1.5);

  // Items Table Header
  const tableTop = doc.y;
  doc.font('Helvetica-Bold');
  doc.text('Item Description', 50, tableTop);
  doc.text('Qty', 300, tableTop);
  doc.text('Unit Price', 370, tableTop);
  doc.text('Total Price', 470, tableTop, { align: 'right' });
  doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

  let position = tableTop + 25;
  doc.font('Helvetica');

  order.items.forEach((item) => {
    doc.text(item.name, 50, position, { width: 230 });
    doc.text(item.qty.toString(), 300, position);
    doc.text(`LKR ${(item.price || 0).toLocaleString()}`, 370, position);
    doc.text(`LKR ${((item.price || 0) * item.qty).toLocaleString()}`, 470, position, { align: 'right' });
    position += 20;
  });

  doc.moveTo(50, position + 5).lineTo(550, position + 5).stroke();

  // Summary
  position += 15;
  doc.font('Helvetica-Bold').text(`Total Amount: LKR ${(order.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 350, position, { align: 'right' });

  // Footer
  doc.moveDown(4);
  doc
    .fontSize(9)
    .font('Helvetica-Oblique')
    .text('Thank you for shopping with ENNIGMA PARIS.', { align: 'center' });

  doc.end();
};
