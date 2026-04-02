const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');

const emptyShippingAddress = () => ({
  fullName: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  zip: '',
});

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

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({
      userId,
      items: [],
      shippingAddress: emptyShippingAddress(),
    });
  }

  return cart;
};

const loadCartResponse = async (userId) => {
  const cart = await Cart.findOne({ userId }).populate('items.productId');

  if (!cart) {
    return {
      userId,
      items: [],
      shippingAddress: emptyShippingAddress(),
      activeOrderId: null,
    };
  }

  return cart;
};

const releaseActiveOrder = async (cart, userId) => {
  if (!cart.activeOrderId) {
    return;
  }

  const order = await Order.findOne({
    _id: cart.activeOrderId,
    userId,
    paymentStatus: 'pending',
  });

  if (order) {
    for (const item of order.products) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity },
      });
    }

    await Order.deleteOne({ _id: order._id });
  }

  cart.activeOrderId = null;
};

exports.getMyCart = async (req, res, next) => {
  try {
    const cart = await loadCartResponse(req.user._id);
    res.json(cart);
  } catch (error) {
    next(error);
  }
};

exports.addCartItem = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const normalizedQuantity = Math.max(1, Number(quantity) || 1);

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock < normalizedQuantity) {
      return res.status(400).json({ message: 'Requested quantity is not available in stock' });
    }

    const cart = await getOrCreateCart(req.user._id);
    await releaseActiveOrder(cart, req.user._id);

    const existingItem = cart.items.find((item) => item.productId.toString() === productId);
    if (existingItem) {
      const nextQuantity = existingItem.quantity + normalizedQuantity;
      if (nextQuantity > product.stock) {
        return res.status(400).json({ message: 'Requested quantity exceeds available stock' });
      }

      existingItem.quantity = nextQuantity;
    } else {
      cart.items.push({ productId, quantity: normalizedQuantity });
    }

    await cart.save();
    res.json(await loadCartResponse(req.user._id));
  } catch (error) {
    next(error);
  }
};

exports.updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const normalizedQuantity = Number(quantity);

    if (!Number.isFinite(normalizedQuantity) || normalizedQuantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock < normalizedQuantity) {
      return res.status(400).json({ message: 'Requested quantity exceeds available stock' });
    }

    const cart = await getOrCreateCart(req.user._id);
    await releaseActiveOrder(cart, req.user._id);

    const existingItem = cart.items.find(
      (item) => item.productId.toString() === req.params.productId,
    );

    if (!existingItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    existingItem.quantity = normalizedQuantity;
    await cart.save();

    res.json(await loadCartResponse(req.user._id));
  } catch (error) {
    next(error);
  }
};

exports.removeCartItem = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    await releaseActiveOrder(cart, req.user._id);

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== req.params.productId,
    );

    await cart.save();
    res.json(await loadCartResponse(req.user._id));
  } catch (error) {
    next(error);
  }
};

exports.clearCart = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    await releaseActiveOrder(cart, req.user._id);

    cart.items = [];
    cart.shippingAddress = emptyShippingAddress();
    cart.activeOrderId = null;

    await cart.save();
    res.json(await loadCartResponse(req.user._id));
  } catch (error) {
    next(error);
  }
};

exports.updateShippingAddress = async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    const nextAddress = normalizeShippingAddress(req.body);

    cart.shippingAddress = nextAddress;

    if (cart.activeOrderId) {
      const order = await Order.findOne({
        _id: cart.activeOrderId,
        userId: req.user._id,
        paymentStatus: 'pending',
      });

      if (order) {
        order.shippingAddress = nextAddress;
        await order.save();
      } else {
        cart.activeOrderId = null;
      }
    }

    await cart.save();
    res.json(await loadCartResponse(req.user._id));
  } catch (error) {
    next(error);
  }
};
