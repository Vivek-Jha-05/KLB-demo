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

const storage = multer.memoryStorage();

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
