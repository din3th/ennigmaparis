import mongoose from 'mongoose';
import 'dotenv/config';

/**
 * One-off migration for orders created before the schema was tightened:
 * - `user` and `items.product` were Mixed and could hold non-ObjectId strings
 *   (e.g. "usr_123", "fallback_4"); those are cleared so the documents validate.
 * - adds an empty statusHistory and currency where missing.
 *
 * Usage: node scripts/migrate-orders.js            (dry run)
 *        node scripts/migrate-orders.js --apply
 */
const apply = process.argv.includes('--apply');
const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!uri) {
  console.error('MONGODB_URI is required');
  process.exit(1);
}

await mongoose.connect(uri);
const orders = mongoose.connection.collection('orders');
const isOid = (v) => v instanceof mongoose.Types.ObjectId || (typeof v === 'string' && /^[0-9a-f]{24}$/i.test(v));

let changed = 0;
for await (const order of orders.find({})) {
  const set = {};
  if (order.user && !isOid(order.user)) set.user = null;
  else if (typeof order.user === 'string') set.user = new mongoose.Types.ObjectId(order.user);

  if (Array.isArray(order.items)) {
    const items = order.items.map((i) => ({
      ...i,
      product: isOid(i.product) ? new mongoose.Types.ObjectId(String(i.product)) : null,
    }));
    if (JSON.stringify(items) !== JSON.stringify(order.items)) set.items = items;
  }
  if (!order.statusHistory) set.statusHistory = [];
  if (!order.currency) set.currency = 'LKR';

  if (Object.keys(set).length) {
    changed++;
    console.log(`${apply ? 'Updating' : 'Would update'} order ${order._id}:`, Object.keys(set).join(', '));
    if (apply) await orders.updateOne({ _id: order._id }, { $set: set });
  }
}

console.log(`${changed} order(s) ${apply ? 'updated' : 'need updating'}.`);
await mongoose.disconnect();
