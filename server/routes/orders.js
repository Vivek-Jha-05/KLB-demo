const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, getAllOrders, updateOrderStatus } = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/', protect, createOrder);
router.get('/mine', protect, getMyOrders);
router.get('/admin', protect, adminOnly, getAllOrders);
router.put('/admin/:id', protect, adminOnly, updateOrderStatus);

module.exports = router;
