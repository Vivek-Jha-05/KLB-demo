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
const upload = require('../middleware/upload');
const { cacheMiddleware } = require('../middleware/cache');

const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for CSV/JSON
});

router.get('/', cacheMiddleware(120), getProducts);
router.get('/:id', cacheMiddleware(120), getProductById);
router.post('/admin', protect, adminOnly, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'images', maxCount: 8 }]), createProduct);
router.post('/admin/import', protect, adminOnly, importUpload.single('file'), importProducts);
router.put('/admin/:id', protect, adminOnly, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'images', maxCount: 8 }]), updateProduct);
router.delete('/admin/:id', protect, adminOnly, deleteProduct);

module.exports = router;
