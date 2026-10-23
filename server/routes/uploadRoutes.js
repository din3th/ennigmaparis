import path from 'path';
import fs from 'fs';
import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

const router = express.Router();

// Determine if running on serverless (e.g. Vercel)
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const uploadsDir = isServerless ? path.join('/tmp', 'uploads') : path.join(process.cwd(), 'uploads');

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (e) {
  console.warn('[Uploads Directory Init]:', e.message);
}

// Check Cloudinary Configuration
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_URL || 
  (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
);

if (isCloudinaryConfigured) {
  if (!process.env.CLOUDINARY_URL) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }
  console.log('✅ Cloudinary Permanent CDN Image Hosting: ACTIVE');
} else {
  console.log('ℹ️ Cloudinary credentials not detected; using resilient local/tmp disk storage fallback');
}

// Use Memory Storage so file.buffer can be sent directly to Cloudinary or saved to disk
const memoryStorage = multer.memoryStorage();

function checkImageFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|webp|gif|avif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype) || file.mimetype.startsWith('image/');

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Images only (JPG, PNG, WEBP, GIF)!'));
}

const uploadImage = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter(req, file, cb) {
    checkImageFileType(file, cb);
  },
});

function checkReceiptFileType(file, cb) {
  const allowedExts = /pdf|jpg|jpeg|png|webp/;
  const extname = allowedExts.test(path.extname(file.originalname).toLowerCase());
  const isPdfOrImage = file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/');

  if (extname && isPdfOrImage) {
    return cb(null, true);
  }
  cb(new Error('Only PDF documents or image files (JPG, PNG, WEBP) are allowed!'));
}

const uploadReceipt = multer({
  storage: memoryStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max for receipt
  fileFilter(req, file, cb) {
    checkReceiptFileType(file, cb);
  },
});

/**
 * Helper to upload a buffer stream to Cloudinary
 */
const uploadStreamToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'ennigma/catalog',
        resource_type: options.resourceType || 'auto',
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

/**
 * Helper to save buffer to local disk /tmp
 */
const saveToLocalDisk = (file, prefix = 'image') => {
  const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
  const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${prefix}-${Date.now()}-${cleanBase}${ext}`;
  const targetPath = path.join(uploadsDir, filename);
  fs.writeFileSync(targetPath, file.buffer);
  return `/uploads/${filename}`;
};

// @route   GET /api/upload/config
// @desc    Inspect current CDN & storage status
router.get('/config', (req, res) => {
  res.json({
    cloudinaryEnabled: isCloudinaryConfigured,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || (process.env.CLOUDINARY_URL ? 'Configured via CLOUDINARY_URL' : null),
    storageMode: isCloudinaryConfigured ? 'Cloudinary Permanent Global CDN' : (isServerless ? 'Vercel /tmp (Ephemeral)' : 'Local Disk Storage'),
  });
});

// @route   POST /api/upload/receipt
// @desc    Upload bank fund transfer confirmation (PDF or Image) to Cloudinary or Disk
router.post('/receipt', (req, res) => {
  uploadReceipt.single('receipt')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message || 'Invalid file format. Only PDF or image files accepted.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No confirmation file provided.' });
    }

    try {
      let fileUrl = '';
      if (isCloudinaryConfigured) {
        try {
          const isPdf = req.file.mimetype === 'application/pdf';
          const cloudResult = await uploadStreamToCloudinary(req.file.buffer, {
            folder: 'ennigma/receipts',
            resourceType: isPdf ? 'raw' : 'image',
          });
          fileUrl = cloudResult.secure_url;
        } catch (cloudErr) {
          console.warn('Cloudinary upload warning (falling back to disk):', cloudErr.message);
          fileUrl = saveToLocalDisk(req.file, 'receipt');
        }
      } else {
        fileUrl = saveToLocalDisk(req.file, 'receipt');
      }

      res.json({
        message: 'Transfer confirmation uploaded successfully',
        url: fileUrl,
        filename: req.file.originalname,
        originalName: req.file.originalname,
        fileType: req.file.mimetype,
        size: req.file.size,
      });
    } catch (uploadError) {
      console.error('Receipt upload processing error:', uploadError);
      res.status(500).json({ message: 'Error processing receipt upload' });
    }
  });
});

// @route   POST /api/upload
// @desc    Upload multiple product images to Cloudinary permanent CDN or disk
router.post('/', uploadImage.array('images', 10), async (req, res) => {
  const files = req.files || (req.file ? [req.file] : []);

  if (files.length === 0) {
    return res.status(400).json({ message: 'No image files provided' });
  }

  try {
    const imageUrls = await Promise.all(
      files.map(async (file) => {
        if (isCloudinaryConfigured) {
          try {
            const cloudResult = await uploadStreamToCloudinary(file.buffer, {
              folder: 'ennigma/catalog',
              resourceType: 'image',
            });
            return cloudResult.secure_url;
          } catch (cloudErr) {
            console.warn('Cloudinary upload failed for item, using disk fallback:', cloudErr.message);
            return saveToLocalDisk(file, 'product');
          }
        } else {
          return saveToLocalDisk(file, 'product');
        }
      })
    );

    res.json({
      message: `${imageUrls.length} Image(s) Uploaded Successfully`,
      image: imageUrls[0],
      images: imageUrls,
      cdn: isCloudinaryConfigured ? 'Cloudinary CDN' : 'Local Storage',
    });
  } catch (error) {
    console.error('Image batch upload error:', error);
    res.status(500).json({ message: 'Failed to process image uploads' });
  }
});

// @route   POST /api/upload/single
// @desc    Upload single image
router.post('/single', uploadImage.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file uploaded' });
  }

  try {
    let imageUrl = '';
    if (isCloudinaryConfigured) {
      try {
        const cloudResult = await uploadStreamToCloudinary(req.file.buffer, {
          folder: 'ennigma/catalog',
          resourceType: 'image',
        });
        imageUrl = cloudResult.secure_url;
      } catch (cloudErr) {
        console.warn('Cloudinary upload failed for single image, using disk fallback:', cloudErr.message);
        imageUrl = saveToLocalDisk(req.file, 'single');
      }
    } else {
      imageUrl = saveToLocalDisk(req.file, 'single');
    }

    res.json({
      message: 'Image Uploaded Successfully',
      image: imageUrl,
      images: [imageUrl],
      cdn: isCloudinaryConfigured ? 'Cloudinary CDN' : 'Local Storage',
    });
  } catch (error) {
    console.error('Single image upload error:', error);
    res.status(500).json({ message: 'Failed to upload image' });
  }
});

export default router;
