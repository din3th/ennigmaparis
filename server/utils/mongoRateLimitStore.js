import mongoose from 'mongoose';

/**
 * express-rate-limit store backed by MongoDB, so limits hold across
 * serverless instances (Vercel) and process restarts. Uses a TTL index to
 * expire old windows automatically.
 */
export default class MongoRateLimitStore {
  constructor({ prefix = 'rl' } = {}) {
    this.prefix = prefix;
    this.localKeys = false;
  }

  init(options) {
    this.windowMs = options.windowMs;
  }

  get collection() {
    return mongoose.connection.collection('ratelimits');
  }

  async ensureIndex() {
    if (MongoRateLimitStore.indexReady) return;
    MongoRateLimitStore.indexReady = true;
    try {
      await this.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    } catch {
      MongoRateLimitStore.indexReady = false;
    }
  }

  key(key) {
    return `${this.prefix}:${key}`;
  }

  async increment(key) {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Rate limit store unavailable');
    }
    await this.ensureIndex();
    const now = new Date();
    const windowExpired = { $lte: [{ $ifNull: ['$expiresAt', new Date(0)] }, now] };
    const doc = await this.collection.findOneAndUpdate(
      { _id: this.key(key) },
      [
        {
          $set: {
            hits: { $cond: [windowExpired, 1, { $add: ['$hits', 1] }] },
            expiresAt: { $cond: [windowExpired, new Date(now.getTime() + this.windowMs), '$expiresAt'] },
          },
        },
      ],
      { upsert: true, returnDocument: 'after', includeResultMetadata: false }
    );
    const value = doc?.value ?? doc;
    return { totalHits: value.hits, resetTime: value.expiresAt };
  }

  async decrement(key) {
    if (mongoose.connection.readyState !== 1) return;
    await this.collection.updateOne({ _id: this.key(key), hits: { $gt: 0 } }, { $inc: { hits: -1 } });
  }

  async resetKey(key) {
    if (mongoose.connection.readyState !== 1) return;
    await this.collection.deleteOne({ _id: this.key(key) });
  }
}
