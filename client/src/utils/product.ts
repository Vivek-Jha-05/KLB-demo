import type { Product } from '../types';

export const getProductImages = (product: Pick<Product, 'image' | 'images'>) => {
  return Array.from(
    new Set([product.image, ...(product.images ?? [])].filter(Boolean)),
  );
};

export const getPrimaryProductImage = (product: Pick<Product, 'image' | 'images'>) => {
  return getProductImages(product)[0] ?? '';
};
