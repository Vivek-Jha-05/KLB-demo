const Order = require('../models/Order');
const Product = require('../models/Product');
const Prescription = require('../models/Prescription');
const Cart = require('../models/Cart');

const getPagination = (query = {}, fallbackLimit = 20) => {
  const hasLimit = typeof query.limit !== 'undefined';
  if (!hasLimit) {
    return { page: 1, limit: null, skip: 0 };
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(500, Math.max(1, Number(query.limit) || fallbackLimit));

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const normalizeShippingAddress = (address = {}) => ({
  fullName: typeof address.fullName === 'string' ? address.fullName.trim() : '',
  phone: typeof address.phone === 'string' ? address.phone.trim() : '',
  street: typeof address.street === 'string' ? address.street.trim() : '',
  city: typeof address.city === 'string' ? address.city.trim() : '',
  state: typeof address.state === 'string' ? address.state.trim() : '',
  zip:
    typeof address.zip === 'string'
      ? address.zip.trim()
      : typeof address.pincode === 'string'
        ? address.pincode.trim()
        : '',
});

const hasCompleteShippingAddress = (address) =>
  Boolean(
    address.fullName &&
      address.phone &&
      address.street &&
      address.city &&
      address.state &&
      address.zip,
  );

const resolvePrescriptionState = async (userId, needsPrescription, prescriptionId) => {
  if (!needsPrescription) {
    return { orderStatus: 'processing', resolvedPrescriptionId: null };
  }

  if (!prescriptionId) {
    const error = new Error('Prescription required. Please upload a prescription first.');
    error.statusCode = 400;
    error.payload = { requiresPrescription: true };
    throw error;
  }

  const prescription = await Prescription.findOne({ _id: prescriptionId, userId });
  if (!prescription) {
    const error = new Error('Prescription not found');
    error.statusCode = 400;
    throw error;
  }

  return {
    orderStatus: prescription.status === 'approved' ? 'processing' : 'pending_approval',
    resolvedPrescriptionId: prescription._id,
  };
};

exports.createOrder = async (req, res) => {
  try {
    const { shippingAddress, prescriptionId } = req.body;
    const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }

    const resolvedShippingAddress = normalizeShippingAddress(shippingAddress || cart.shippingAddress);
    if (!hasCompleteShippingAddress(resolvedShippingAddress)) {
      return res.status(400).json({ message: 'Complete delivery address is required' });
    }

    cart.shippingAddress = resolvedShippingAddress;

    if (cart.activeOrderId) {
      const existingOrder = await Order.findOne({ _id: cart.activeOrderId, userId: req.user._id });

      if (existingOrder && existingOrder.paymentStatus !== 'paid') {
        const prescriptionState = await resolvePrescriptionState(
          req.user._id,
          existingOrder.requiresPrescription,
          prescriptionId || existingOrder.prescriptionId,
        );

        existingOrder.shippingAddress = resolvedShippingAddress;
        existingOrder.orderStatus = prescriptionState.orderStatus;
        existingOrder.prescriptionId = prescriptionState.resolvedPrescriptionId;
        await Promise.all([existingOrder.save(), cart.save()]);
        return res.status(200).json(existingOrder);
      }

      cart.activeOrderId = null;
    }

    let totalAmount = 0;
    let needsPrescription = false;
    const orderProducts = [];

    for (const item of cart.items) {
      const dbProduct = item.productId;
      if (!dbProduct) {
        return res.status(400).json({ message: 'One or more cart items are no longer available' });
      }

      if (dbProduct.stock < item.quantity) {
        return res.status(400).json({ message: `${dbProduct.name} is out of stock` });
      }

      if (dbProduct.requiresPrescription) {
        needsPrescription = true;
      }

      totalAmount += dbProduct.price * item.quantity;
      orderProducts.push({
        productId: dbProduct._id,
        name: dbProduct.name,
        price: dbProduct.price,
        quantity: item.quantity,
        image: dbProduct.image
      });
    }

    const shippingFee = totalAmount >= 500 ? 0 : 50;
    totalAmount += shippingFee;

    const prescriptionState = await resolvePrescriptionState(
      req.user._id,
      needsPrescription,
      prescriptionId,
    );

    // Decrease stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.productId._id, { $inc: { stock: -item.quantity } });
    }

    const order = await Order.create({
      userId: req.user._id,
      products: orderProducts,
      totalAmount,
      shippingAddress: resolvedShippingAddress,
      orderStatus: prescriptionState.orderStatus,
      prescriptionId: prescriptionState.resolvedPrescriptionId,
      requiresPrescription: needsPrescription
    });

    cart.activeOrderId = order._id;
    await cart.save();

    res.status(201).json(order);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message || 'Server error',
      ...(error.payload || {}),
      error: error.statusCode ? undefined : error.message,
    });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('prescriptionId');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.orderStatus = status;
    const pagination = getPagination(req.query, 20);
    const ordersQuery = Order.find(filter).sort({ createdAt: -1 })
      .populate('userId', 'name email')
      .populate('prescriptionId');

    if (pagination.limit) {
      ordersQuery.skip(pagination.skip).limit(pagination.limit);
    }

    const [orders, total] = await Promise.all([
      ordersQuery,
      Order.countDocuments(filter),
    ]);
    res.json({
      orders,
      page: pagination.page,
      totalPages: pagination.limit ? Math.max(1, Math.ceil(total / pagination.limit)) : 1,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus },
      { new: true }
    ).populate('userId', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
