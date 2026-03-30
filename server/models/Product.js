const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  subtitle: { type: String, default: '' },
  manufacturer: { type: String, default: '' },
  dosage: { type: String, default: '' },
  image: { type: String, default: '' },
  images: { type: [String], default: [] },
  stock: { type: Number, required: true, default: 0, min: 0 },
  requiresPrescription: { type: Boolean, default: false },
  featured: { type: Boolean, default: false }
}, { timestamps: true });

productSchema.pre('validate', function syncImages(next) {
  const imageList = Array.isArray(this.images) ? this.images : [];
  const normalizedImages = Array.from(
    new Set(
      [...imageList, this.image]
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean),
    ),
  );

  this.images = normalizedImages;
  this.image = normalizedImages[0] || '';
  next();
});

productSchema.index({ category: 1 });
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
