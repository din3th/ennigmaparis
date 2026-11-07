import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import express from 'express';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import { protect, admin } from '../middleware/authMiddleware.js';
import { receiptUploadLimiter } from '../middleware/rateLimiters.js';
import { HttpError } from '../middleware/errorHandler.js';
import { config } from '../config/env.js';
import Media from '../models/Media.js';
import logger from '../utils/logger.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = config.isServerless ? path.join('/tmp', 'uploads') : path.join(__dirname, '..', 'uploads');

const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_URL ||
  (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
);

if (isCloudinaryConfigured && !process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}
if (!isCloudinaryConfigured && config.isProduction) {
  logger.warn('Cloudinary is not configured; uploads are stored inside MongoDB. Set CLOUDINARY_URL to move file storage to a CDN.');
}

/**
 * Identifies a file by its leading bytes rather than trusting the browser's
 * declared type or the file extension. SVG is intentionally not supported:
 * it can carry script.
 */
const SIGNATURES = [
  { type: 'image/jpeg', ext: '.jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: 'image/png', ext: '.png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { type: 'image/gif', ext: '.gif', test: (b) => b.subarray(0, 4).toString('ascii') === 'GIF8' },
  { type: 'image/webp', ext: '.webp', test: (b) => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP' },
  { type: 'image/avif', ext: '.avif', test: (b) => b.subarray(4, 8).toString('ascii') === 'ftyp' && /avi[fs]/.test(b.subarray(8, 12).toString('ascii')) },
  { type: 'application/pdf', ext: '.pdf', test: (b) => b.subarray(0, 5).toString('ascii') === '%PDF-' },
];

const sniff = (buffer, allowed) => {
  const match = SIGNATURES.find((s) => s.test(buffer));
  return match && allowed.includes(match.type) ? match : null;
};

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
const RECEIPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const memoryUpload = (maxBytes) => multer({ storage: multer.memoryStorage(), limits: { fileSize: maxBytes, files: 10 } });
const imageUpload = memoryUpload(10 * 1024 * 1024);
const receiptUpload = memoryUpload(8 * 1024 * 1024);

/** Wraps a multer middleware so its errors become clean 400 responses. */
const runMulter = (mw) => (req, res, next) =>
  mw(req, res, (err) => {
    if (err) return next(new HttpError(400, err instanceof multer.MulterError ? `Upload error: ${err.message}` : err.message));
    next();
  });

const uploadToCloudinary = (buffer, { folder, resourceType }) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: resourceType }, (error, result) =>
      error ? reject(error) : resolve(result)
    );
    stream.end(buffer);
  });

/**
 * Fallback when Cloudinary is not configured: persist to MongoDB so the file is
 * visible from every deployment sharing the database, and cache on local disk
 * when the host has one.
 */
const storeLocally = async (file, detected, prefix) => {
  // Random, unguessable name: receipts contain personal banking details.
  const filename = `${prefix}-${crypto.randomBytes(16).toString('hex')}${detected.ext}`;

  await Media.create({ filename, contentType: detected.type, data: file.buffer, size: file.buffer.length });
  if (!config.isServerless) {
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
      await fs.promises.writeFile(path.join(uploadsDir, filename), file.buffer);
    } catch (err) {
      logger.warn('Could not cache upload on disk', { err });
    }
  }
  return `/uploads/${filename}`;
};

const storeFile = async (file, { allowed, prefix, folder }) => {
  const detected = sniff(file.buffer, allowed);
  if (!detected) {
    throw new HttpError(400, `Unsupported file type for ${file.originalname}`);
  }
  if (isCloudinaryConfigured) {
    const result = await uploadToCloudinary(file.buffer, {
      folder,
      resourceType: detected.type === 'application/pdf' ? 'raw' : 'image',
    });
    return { url: result.secure_url, detected };
  }
  return { url: await storeLocally(file, detected, prefix), detected };
};

// @route   GET /api/upload/config
// @access  Private/Admin
router.get('/config', protect, admin, (req, res) => {
  res.json({
    cloudinaryEnabled: isCloudinaryConfigured,
    storageMode: isCloudinaryConfigured ? 'Cloudinary CDN' : config.isServerless ? 'MongoDB (fallback)' : 'Local disk',
  });
});

// @route   POST /api/upload/receipt
// @desc    Upload a bank transfer slip (PDF or image) during checkout
// @access  Public (rate limited)
router.post('/receipt', receiptUploadLimiter, runMulter(receiptUpload.single('receipt')), async (req, res) => {
  if (!req.file) throw new HttpError(400, 'No confirmation file provided.');
  const { url, detected } = await storeFile(req.file, { allowed: RECEIPT_TYPES, prefix: 'receipt', folder: 'ennigma/receipts' });
  res.json({
    message: 'Transfer confirmation uploaded successfully',
    url,
    filename: path.basename(url),
    originalName: req.file.originalname.slice(0, 255),
    fileType: detected.type,
    size: req.file.size,
  });
});

const handleImageUpload = async (files) =>
  Promise.all(files.map(async (file) => (await storeFile(file, { allowed: IMAGE_TYPES, prefix: 'product', folder: 'ennigma/catalog' })).url));

// @route   POST /api/upload
// @desc    Upload up to 10 product images
// @access  Private/Admin
router.post('/', protect, admin, runMulter(imageUpload.array('images', 10)), async (req, res) => {
  const files = req.files || [];
  if (files.length === 0) throw new HttpError(400, 'No image files provided');
  const images = await handleImageUpload(files);
  res.json({
    message: `${images.length} image(s) uploaded`,
    image: images[0],
    images,
    cdn: isCloudinaryConfigured ? 'Cloudinary CDN' : 'Local Storage',
  });
});

// @route   POST /api/upload/single
// @desc    Upload a single image
// @access  Private/Admin
router.post('/single', protect, admin, runMulter(imageUpload.single('image')), async (req, res) => {
  if (!req.file) throw new HttpError(400, 'No image file uploaded');
  const [image] = await handleImageUpload([req.file]);
  res.json({ message: 'Image uploaded', image, images: [image], cdn: isCloudinaryConfigured ? 'Cloudinary CDN' : 'Local Storage' });
});

export default router;
