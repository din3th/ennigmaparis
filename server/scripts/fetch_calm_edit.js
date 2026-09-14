import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fetchCalmEditProducts = async () => {
  try {
    console.log('Fetching live products from https://ennigmaparis.com/collections/the-calm-edit/products.json ...');
    
    const response = await fetch('https://ennigmaparis.com/collections/the-calm-edit/products.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Successfully fetched ${data.products.length} products!`);

    const formattedProducts = data.products.map((p) => {
      const firstVariant = p.variants && p.variants[0] ? p.variants[0] : {};
      const price = parseFloat(firstVariant.price) || 0;
      const comparePrice = firstVariant.compare_at_price ? parseFloat(firstVariant.compare_at_price) : null;

      // Extract unique size options from variants
      const sizes = Array.from(
        new Set(
          p.variants
            .map((v) => v.option1 || v.title)
            .filter((s) => s && s.toLowerCase() !== 'default title')
        )
      );

      // Clean HTML tags from body_html
      const cleanDescription = p.body_html
        ? p.body_html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim()
        : 'No description available.';

      const imageUrls = p.images ? p.images.map((img) => img.src) : [];

      // Smart Category & Subcategory Assignment
      const titleLower = p.title.toLowerCase();
      let category = 'Women';
      let subcategory = 'Dresses & Evening Gowns';

      if (titleLower.includes('dress') || titleLower.includes('gown') || titleLower.includes('set')) {
        category = 'Women';
        subcategory = 'Dresses & Evening Gowns';
      } else if (titleLower.includes('top') || titleLower.includes('blouse') || titleLower.includes('shirt') || titleLower.includes('tee')) {
        category = 'Women';
        subcategory = 'Blouses & Tops';
      } else if (titleLower.includes('trouser') || titleLower.includes('pant') || titleLower.includes('jean') || titleLower.includes('skirt') || titleLower.includes('short')) {
        category = 'Women';
        subcategory = 'Tailored Trousers';
      } else if (titleLower.includes('men') || titleLower.includes('polo')) {
        category = 'Men';
        subcategory = 'Crisp Shirts & Polos';
      } else if (titleLower.includes('suit') || titleLower.includes('blazer')) {
        category = 'Men';
        subcategory = 'Suits & Parisian Blazers';
      }

      return {
        name: p.title,
        slug: p.handle,
        description: cleanDescription,
        price,
        salePrice: comparePrice,
        images: imageUrls,
        category,
        subcategory,
        sizes: sizes.length > 0 ? sizes : ['UK 6', 'UK 8', 'UK 10', 'UK 12', 'UK 14'],
        stock: 12,
        brand: 'ENNIGMA PARIS',
        isFeatured: true,
        isNewArrival: true,
        collectionName: 'The Calm Edit',
        rating: 4.8,
        numReviews: 3,
      };
    });

    const outputPath = path.join(__dirname, '../data/calm_edit_products.json');
    const dataDir = path.dirname(outputPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(formattedProducts, null, 2), 'utf8');
    console.log(`Saved ${formattedProducts.length} formatted & categorized products to ${outputPath}`);
  } catch (error) {
    console.error('Error fetching collection products:', error);
    process.exit(1);
  }
};

fetchCalmEditProducts();
