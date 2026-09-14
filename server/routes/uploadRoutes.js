import path from 'path';
import express from 'express';
import multer from 'multer';

const router = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Images only!');
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

router.post('/', upload.array('images', 10), (req, res) => {
  if (req.files && req.files.length > 0) {
    const imageUrls = req.files.map((file) => `http://localhost:3001/${file.path}`);
    return res.send({
      message: `${req.files.length} Images Uploaded`,
      image: imageUrls[0],
      images: imageUrls,
    });
  }
  
  if (req.file) {
    const imageUrl = `http://localhost:3001/${req.file.path}`;
    return res.send({
      message: 'Image Uploaded',
      image: imageUrl,
      images: [imageUrl],
    });
  }

  res.status(400).send({ message: 'No image files provided' });
});

router.post('/single', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).send({ message: 'No file uploaded' });
  const imageUrl = `http://localhost:3001/${req.file.path}`;
  res.send({
    message: 'Image Uploaded',
    image: imageUrl,
    images: [imageUrl],
  });
});

export default router;

