const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Cart = require('../models/Cart');

const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
};

exports.createPaymentOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findOne({ _id: orderId, userId: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.orderStatus === 'pending_approval') {
      return res.status(400).json({
        message: 'Order is pending prescription approval. Payment not allowed yet.'
      });
    }
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Order is already paid' });
    }

    if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'your_razorpay_key_id') {
      return res.status(503).json({
        message: 'Razorpay is not configured on the server.'
      });
    }

    const razorpay = getRazorpayInstance();
    const rpOrder = await razorpay.orders.create({
      amount: Math.round(order.totalAmount * 100),
      currency: 'INR',
      receipt: order._id.toString()
    });

    order.razorpayOrderId = rpOrder.id;
    await order.save();

    res.json({
      orderId: rpOrder.id,
      amount: rpOrder.amount,
      currency: rpOrder.currency,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    res.status(500).json({ message: 'Payment error', error: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.paymentStatus = 'paid';
    order.paymentId = razorpay_payment_id;
    await order.save();

    await Cart.findOneAndUpdate(
      { userId: order.userId, activeOrderId: order._id },
      {
        items: [],
        shippingAddress: {
          fullName: '',
          phone: '',
          street: '',
          city: '',
          state: '',
          zip: '',
        },
        activeOrderId: null,
      },
    );

    res.json({ message: 'Payment verified successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
