import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

let mongo;
let app;

export const startApp = async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri('ennigma_test');
  ({ default: app } = await import('../server.js'));
  const { connectDB } = await import('../config/db.js');
  await connectDB();
  return app;
};

export const stopApp = async () => {
  await mongoose.disconnect();
  await mongo?.stop();
};

export const resetDb = async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
};

/** A supertest agent that keeps cookies and sends the CSRF header. */
export const client = () => {
  const agent = request.agent(app);
  const wrap = (method) => (url) => agent[method](url).set('X-Requested-With', 'XMLHttpRequest');
  return { agent, get: wrap('get'), post: wrap('post'), put: wrap('put'), delete: wrap('delete') };
};

export const makeAdmin = async (email) => {
  const User = (await import('../models/User.js')).default;
  await User.updateOne({ email }, { role: 'admin' });
};
