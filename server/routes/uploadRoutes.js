import path from 'path';
import fs from 'fs';
import express from 'express';
import multer from 'multer';

const router = express.Router();

// Ensure uploads directory exists (use /tmp on serverless like Vercel to prevent read-only filesystem crash)
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const uploadsDir = isServerless ? path.join('/tmp', 'uploads') : path.join(process.cwd(), 'uploads');

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (e) {
  console.warn('[Uploads Directory]:', e.message);
}

// Storage for general image uploads
const imageStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${Date.now()}${ext}`);
  },
});

function checkImageFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Images only (JPG, PNG, WEBP)!'));
}

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter(req, file, cb) {
    checkImageFileType(file, cb);
  },
});

// Storage and filter for Bank Transfer Receipts (PDF or Images only)
const receiptStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `receipt-${Date.now()}-${cleanBase}${ext}`);
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
  storage: receiptStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max for receipt
  fileFilter(req, file, cb) {
    checkReceiptFileType(file, cb);
  },
});

// @route   POST /api/upload/receipt
// @desc    Upload bank fund transfer confirmation (PDF or Image)
router.post('/receipt', (req, res) => {
  uploadReceipt.single('receipt')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message || 'Invalid file format. Only PDF or image files accepted.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No confirmation file provided.' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      message: 'Transfer confirmation uploaded successfully',
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileType: req.file.mimetype,
      size: req.file.size,
    });
  });
});

// Multiple product images upload
router.post('/', uploadImage.array('images', 10), (req, res) => {
  if (req.files && req.files.length > 0) {
    const imageUrls = req.files.map((file) => `/uploads/${file.filename}`);
    return res.json({
      message: `${req.files.length} Images Uploaded`,
      image: imageUrls[0],
      images: imageUrls,
    });
  }

  if (req.file) {
    const imageUrl = `/uploads/${req.file.filename}`;
    return res.json({
      message: 'Image Uploaded',
      image: imageUrl,
      images: [imageUrl],
    });
  }

  res.status(400).json({ message: 'No image files provided' });
});

// Single image upload
router.post('/single', uploadImage.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({
    message: 'Image Uploaded',
    image: imageUrl,
    images: [imageUrl],
  });
});

export default router;
