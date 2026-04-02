const Product = require('../models/Product');
const { invalidateCache } = require('../middleware/cache');
const cloudinary = require('../config/cloudinary');
const csv = require('csv-parser');
const { Readable } = require('stream');

const DEFAULT_PAGE_SIZE = 12;

/**
 * transformToDirectUrl(url)
 * Converts non-direct URLs (Unsplash, Google Drive) into downloadable formats.
 */
const transformToDirectUrl = (url) => {
  if (!url || typeof url !== 'string') return url;

  // 1. Handle Unsplash
  if (url.includes('unsplash.com')) {
    // If it doesn't already have query params, append optimization
    if (!url.includes('?')) {
      return `${url}?auto=format&fit=crop&w=800&q=80`;
    }
    return url;
  }

  // 2. Handle Google Drive
  const driveMatch = url.match(/(?:\/file\/d\/|id=)([\w-]+)/);
  if (url.includes('drive.google.com') && driveMatch) {
    const fileId = driveMatch[1];
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  // 3. Return original if no transformation needed
  return url;
};

const buildUploadedImagePaths = (files = {}) => {
  if (!files || typeof files !== 'object') return { primary: '', additional: [] };
  
  const primary = Array.isArray(files.image) && files.image[0] ? files.image[0].path : '';
  const additional = Array.isArray(files.images) ? files.images.map((file) => file.path).filter(Boolean) : [];
  
  return { primary, additional };
};

/**
 * uploadImageFromUrl(url)
 * Reusable helper to transform and upload strings/URLs to Cloudinary
 */
const uploadImageFromUrl = async (source, folder = 'klb_products') => {
  if (!source || typeof source !== 'string') return null;
  // If it's already a Cloudinary URL, don't re-upload
  if (source.includes('res.cloudinary.com')) return source;

  const transformedUrl = transformToDirectUrl(source);
  
  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Cloudinary] Original URL: ${source.substring(0, 50)}...`);
      if (source !== transformedUrl) {
        console.log(`[Cloudinary] Transformed URL: ${transformedUrl.substring(0, 50)}...`);
      }
    }

    const result = await cloudinary.uploader.upload(transformedUrl, {
      folder: folder,
      resource_type: 'auto',
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Cloudinary] Success: ${result.secure_url}`);
    }
    return result.secure_url;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[Cloudinary] Failed for: ${transformedUrl.substring(0, 50)}...`, error.message);
    }
    // FALLBACK: Return original source so import does not break
    return source;
  }
};

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

const normalizeProductPayload = async (payload = {}, uploaded = { primary: '', additional: [] }) => {
  // 1. COLLECT ALL SOURCES
  const imageSource = uploaded.primary || payload.image || '';
  let imagesSources = uploaded.additional.length > 0
    ? uploaded.additional
    : normalizeImageList(payload.images);

  // 2. PARALLEL UPLOAD (OPTIMIZED)
  // Ensure we upload every non-Cloudinary link in parallel
  const uploadTasks = [
    ...imagesSources.map(url => uploadImageFromUrl(url))
  ];

  const results = await Promise.all(uploadTasks);
  
  // 3. FILTER RESULTS
  const [optimizedPrimary, ...optimizedAdditional] = results;
  const filteredAdditional = optimizedAdditional.filter(Boolean);
  
  // Final set: unique Cloudinary URLs only
  const finalImages = Array.from(new Set([optimizedPrimary, ...filteredAdditional].filter(Boolean)));

  return {
    name: toTrimmedString(payload.name),
    price: normalizeNumber(payload.price),
    category: toTrimmedString(payload.category),
    description: toTrimmedString(payload.description),
    subtitle: toTrimmedString(payload.subtitle || payload.dosage),
    manufacturer: toTrimmedString(payload.manufacturer),
    dosage: toTrimmedString(payload.dosage),
    image: finalImages[0] || '',
    images: finalImages,
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

exports.getProducts = async (req, res, next) => {
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
    next(error);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    next(error);
  }
};

exports.createProduct = async (req, res, next) => {
  const uploaded = buildUploadedImagePaths(req.files);

  try {
    const normalizedPayload = await normalizeProductPayload(req.body, uploaded);
    const product = await Product.create(normalizedPayload);
    invalidateCache('/api/products');
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  const uploaded = buildUploadedImagePaths(req.files);

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const currentData = product.toObject();
    const normalizedPayload = await normalizeProductPayload({ ...currentData, ...req.body }, uploaded);
    
    product.set(normalizedPayload);
    await product.save();

    invalidateCache('/api/products');
    res.json(product);
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    invalidateCache('/api/products');
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.importProducts = async (req, res, next) => {
  try {
    let productList = [];

    // 1. Handle manual JSON in body
    if (Array.isArray(req.body?.products)) {
      productList = req.body.products;
    } 
    // 2. Handle File Upload (CSV or JSON)
    else if (req.file) {
      const fileContent = req.file.buffer.toString();
      const filename = req.file.originalname.toLowerCase();

      if (filename.endsWith('.json')) {
        try {
          productList = JSON.parse(fileContent);
          if (!Array.isArray(productList)) productList = [productList];
        } catch (error) {
          return res.status(400).json({ message: 'Invalid JSON file format' });
        }
      } else if (filename.endsWith('.csv')) {
        try {
          productList = await new Promise((resolve, reject) => {
            const results = [];
            Readable.from(fileContent)
              .pipe(csv())
              .on('data', (data) => results.push(data))
              .on('end', () => resolve(results))
              .on('error', (err) => reject(err));
          });
        } catch (error) {
          return res.status(400).json({ message: 'Error parsing CSV file', error: error.message });
        }
      }
    }

    if (productList.length === 0) {
      return res.status(400).json({ message: 'Please provide at least one product to import via JSON body or uploaded file (.csv/.json).' });
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
        if (productId && productId.match(/^[0-9a-fA-F]{24}$/)) {
          existingProduct = await Product.findById(productId);
        }

        if (!existingProduct) {
          // Normalize only once to check for existence
          const normalizedProduct = await normalizeProductPayload(incomingProduct);
          existingProduct = await Product.findOne({
            name: normalizedProduct.name,
            category: normalizedProduct.category,
            manufacturer: normalizedProduct.manufacturer,
          });
        }

        if (existingProduct) {
          // AWAIT the normalization which handles Cloudinary uploads
          const normalizedPayload = await normalizeProductPayload({ ...existingProduct.toObject(), ...incomingProduct });
          existingProduct.set(normalizedPayload);
          await existingProduct.save();
          summary.updated += 1;
        } else {
          // AWAIT the creation and normalization
          const normalizedPayload = await normalizeProductPayload(incomingProduct);
          await Product.create(normalizedPayload);
          summary.created += 1;
        }
      } catch (error) {
        summary.errors.push(`Row ${index + 1} (${incomingProduct.name || 'Unknown'}): ${error.message}`);
      }
    }

    if (summary.created > 0 || summary.updated > 0) {
      invalidateCache('/api/products');
    }

    const statusCode =
      summary.created === 0 && summary.updated === 0 && summary.errors.length > 0 ? 400 : 200;

    res.status(statusCode).json(summary);
  } catch (error) {
    next(error);
  }
};
