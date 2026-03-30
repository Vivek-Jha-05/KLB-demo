const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  importProducts,
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'products'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 8,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
      return;
    }

    cb(new Error('Only image files are allowed for product uploads.'));
  },
});

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/admin', protect, adminOnly, upload.array('images', 8), createProduct);
router.post('/admin/import', protect, adminOnly, importProducts);
router.put('/admin/:id', protect, adminOnly, upload.array('images', 8), updateProduct);
router.delete('/admin/:id', protect, adminOnly, deleteProduct);

module.exports = router;
