const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, default: '' }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  shippingAddress: {
    fullName: { type: String, default: '' },
    phone: { type: String, default: '' },
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zip: { type: String, default: '' }
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: { type: String, default: '' },
  razorpayOrderId: { type: String, default: '' },
  orderStatus: {
    type: String,
    enum: ['pending_approval', 'approved', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'processing'
  },
  prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription', default: null },
  requiresPrescription: { type: Boolean, default: false }
}, { timestamps: true });

orderSchema.index({ userId: 1 });
orderSchema.index({ orderStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);
