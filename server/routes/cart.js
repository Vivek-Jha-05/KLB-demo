const express = require('express');
const router = express.Router();
const {
  addCartItem,
  clearCart,
  getMyCart,
  removeCartItem,
  updateCartItem,
  updateShippingAddress,
} = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getMyCart);
router.post('/items', protect, addCartItem);
router.put('/items/:productId', protect, updateCartItem);
router.delete('/items/:productId', protect, removeCartItem);
router.put('/shipping-address', protect, updateShippingAddress);
router.delete('/', protect, clearCart);

module.exports = router;
