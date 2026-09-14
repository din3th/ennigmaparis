const fs = require('fs');

const rawData = fs.readFileSync('/Users/tharushadin3th/Desktop/Ennigma/scraped_products.json', 'utf8');
const data = JSON.parse(rawData);

const cleanProducts = data.products.map(p => ({
  id: p.id,
  title: p.title,
  handle: p.handle,
  description: p.body_html.replace(/<[^>]*>?/gm, '').trim(), // basic html strip
  price: p.variants[0]?.price || 0,
  compare_at_price: p.variants[0]?.compare_at_price || null,
  images: p.images.map(img => img.src),
  tags: p.tags,
  sizes: p.variants.map(v => v.option1)
}));

fs.mkdirSync('/Users/tharushadin3th/Desktop/Ennigma/client/src/data', { recursive: true });
fs.writeFileSync('/Users/tharushadin3th/Desktop/Ennigma/client/src/data/products.json', JSON.stringify(cleanProducts, null, 2));
console.log('Cleaned products saved to client data.');
