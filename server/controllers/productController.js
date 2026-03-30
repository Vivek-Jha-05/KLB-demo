const Product = require('../models/Product');

const DEFAULT_PAGE_SIZE = 12;

const toTrimmedString = (value) => (typeof value === 'string' ? value.trim() : '');

const normalizeBoolean = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['true', '1', 'yes'].includes(normalized);
  }

  return Boolean(value);
};

const normalizeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeImageList = (value) => {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(value.map((item) => toTrimmedString(item)).filter(Boolean)),
    );
  }

  if (typeof value === 'string') {
    return Array.from(
      new Set(value.split(/[\r\n|]+/g).map((item) => item.trim()).filter(Boolean)),
    );
  }

  return [];
};

const buildUploadedImagePaths = (files = []) =>
  Array.from(
    new Set(
      files
        .map((file) =>
          file?.buffer ? `data:${file.mimetype};base64,${file.buffer.toString('base64')}` : '',
        )
        .filter(Boolean),
    ),
  );

const normalizeProductPayload = (payload = {}, uploadedImages = []) => {
  const hasUploadedImages = uploadedImages.length > 0;
  const primaryImage = hasUploadedImages ? uploadedImages[0] : toTrimmedString(payload.image);
  const images = hasUploadedImages
    ? uploadedImages
    : Array.from(new Set([primaryImage, ...normalizeImageList(payload.images)].filter(Boolean)));

  return {
    name: toTrimmedString(payload.name),
    price: normalizeNumber(payload.price),
    category: toTrimmedString(payload.category),
    description: toTrimmedString(payload.description),
    subtitle: toTrimmedString(payload.subtitle || payload.dosage),
    manufacturer: toTrimmedString(payload.manufacturer),
    dosage: toTrimmedString(payload.dosage),
    image: images[0] || '',
    images,
    stock: Math.max(0, normalizeNumber(payload.stock)),
    requiresPrescription: normalizeBoolean(payload.requiresPrescription),
    featured: normalizeBoolean(payload.featured),
  };
};

const getPagination = (query = {}) => {
  const hasLimit = typeof query.limit !== 'undefined';
  if (!hasLimit) {
    return { page: 1, limit: null, skip: 0 };
  }

  const page = Math.max(1, normalizeNumber(query.page, 1));
  const limit = Math.min(500, Math.max(1, normalizeNumber(query.limit, DEFAULT_PAGE_SIZE)));

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

exports.getProducts = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, prescriptionOnly, sort } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (prescriptionOnly === 'true') filter.requiresPrescription = true;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    else if (sort === 'price_desc') sortOption = { price: -1 };
    else if (sort === 'name') sortOption = { name: 1 };

    const pagination = getPagination(req.query);
    const productsQuery = Product.find(filter).sort(sortOption);

    if (pagination.limit) {
      productsQuery.skip(pagination.skip).limit(pagination.limit);
    }

    const [products, total] = await Promise.all([
      productsQuery,
      Product.countDocuments(filter),
    ]);

    res.json({
      products,
      page: pagination.page,
      totalPages: pagination.limit ? Math.max(1, Math.ceil(total / pagination.limit)) : 1,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createProduct = async (req, res) => {
  const uploadedImages = buildUploadedImagePaths(req.files);

  try {
    const product = await Product.create(normalizeProductPayload(req.body, uploadedImages));
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  const uploadedImages = buildUploadedImagePaths(req.files);

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.set(normalizeProductPayload({ ...product.toObject(), ...req.body }, uploadedImages));
    await product.save();

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.importProducts = async (req, res) => {
  try {
    const productList = Array.isArray(req.body?.products) ? req.body.products : [];
    if (productList.length === 0) {
      return res.status(400).json({ message: 'Please provide at least one product to import.' });
    }

    const summary = {
      total: productList.length,
      created: 0,
      updated: 0,
      errors: [],
    };

    for (let index = 0; index < productList.length; index += 1) {
      const incomingProduct = productList[index];

      try {
        const productId = toTrimmedString(incomingProduct.id || incomingProduct._id);

        let existingProduct = null;
        if (productId) {
          existingProduct = await Product.findById(productId);
        }

        if (!existingProduct) {
          const normalizedProduct = normalizeProductPayload(incomingProduct);
          existingProduct = await Product.findOne({
            name: normalizedProduct.name,
            category: normalizedProduct.category,
            manufacturer: normalizedProduct.manufacturer,
          });
        }

        if (existingProduct) {
          existingProduct.set(
            normalizeProductPayload({ ...existingProduct.toObject(), ...incomingProduct }),
          );
          await existingProduct.save();
          summary.updated += 1;
        } else {
          await Product.create(normalizeProductPayload(incomingProduct));
          summary.created += 1;
        }
      } catch (error) {
        summary.errors.push(`Row ${index + 1}: ${error.message}`);
      }
    }

    const statusCode =
      summary.created === 0 && summary.updated === 0 && summary.errors.length > 0 ? 400 : 200;

    res.status(statusCode).json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
