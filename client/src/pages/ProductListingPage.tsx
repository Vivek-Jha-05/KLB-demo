import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Filter, Grid, Heart, List, ShoppingCart, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { useProductStore } from '../store/productStore';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { Product } from '../types';
import { formatCurrency } from '../utils/formatters';
import { getPrimaryProductImage, getProductImages } from '../utils/product';
import { ProductImage } from '../components/ui/ProductImage';
import { logger } from '../utils/logger';
import { toast } from 'sonner';
import { getErrorMessage } from '../utils/errorUtils';

export const ProductListingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [showPrescriptionOnly, setShowPrescriptionOnly] = useState<boolean | null>(null);

  const { products, fetchProducts, isLoading } = useProductStore();
  const { addToCart } = useCartStore();
  const { user } = useAuthStore();

  const searchQuery = searchParams.get('search') || '';
  const categoryFilter = searchParams.get('category') || 'All';

  useEffect(() => {
    if (products.length === 0) {
      void fetchProducts();
    }
  }, [fetchProducts, products.length]);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(products.map((product) => product.category))).sort()],
    [products],
  );

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query),
      );
    }

    if (categoryFilter !== 'All') {
      result = result.filter((product) => product.category === categoryFilter);
    }

    result = result.filter(
      (product) => product.price >= priceRange.min && product.price <= priceRange.max,
    );

    if (showPrescriptionOnly !== null) {
      result = result.filter(
        (product) => product.requiresPrescription === showPrescriptionOnly,
      );
    }

    switch (sortBy) {
      case 'price-low':
        result.sort((left, right) => left.price - right.price);
        break;
      case 'price-high':
        result.sort((left, right) => right.price - left.price);
        break;
      case 'name':
        result.sort((left, right) => left.name.localeCompare(right.name));
        break;
      default:
        break;
    }

    return result;
  }, [products, searchQuery, categoryFilter, priceRange, showPrescriptionOnly, sortBy]);

  const handleCategoryChange = (category: string) => {
    const nextSearchParams = new URLSearchParams(searchParams);
    if (category === 'All') {
      nextSearchParams.delete('category');
    } else {
      nextSearchParams.set('category', category);
    }
    setSearchParams(nextSearchParams);
  };

  const handleAddToCart = async (event: React.MouseEvent, product: Product) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      toast.info('Please login to add items to cart');
      return;
    }

    try {
      await addToCart(user.id, product);
      toast.success(`Added ${product.name} to cart`);
    } catch (error) {
      logger.error('Failed to add item to cart');
      toast.error(getErrorMessage(error, 'Unable to add item to cart. Please try again.'));
    }
  };

  const clearFilters = () => {
    setSearchParams({});
    setPriceRange({ min: 0, max: 1000 });
    setShowPrescriptionOnly(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Products</h1>
          <p className="text-gray-600">
            {filteredProducts.length} products found
            {searchQuery && ` for "${searchQuery}"`}
            {categoryFilter !== 'All' && ` in ${categoryFilter}`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            className="flex items-center gap-2 rounded-lg border px-4 py-2 md:hidden"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
          <div className="flex items-center gap-2 rounded-lg border p-1">
            <button
              className={`rounded p-2 ${
                viewMode === 'grid' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-400'
              }`}
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              className={`rounded p-2 ${
                viewMode === 'list' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-400'
              }`}
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="name">Sort by Name</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="flex gap-8">
        <aside
          className={`${
            showFilters ? 'fixed inset-0 z-50 overflow-y-auto bg-white p-6' : 'hidden'
          } md:static md:block md:w-64 md:flex-shrink-0`}
        >
          <div className="mb-6 flex items-center justify-between md:hidden">
            <h2 className="text-lg font-semibold">Filters</h2>
            <button onClick={() => setShowFilters(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-6">
            <h3 className="mb-3 font-semibold text-gray-900">Categories</h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`block w-full rounded-lg px-3 py-2 text-left transition-colors ${
                    categoryFilter === category || (category === 'All' && !categoryFilter)
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="mb-3 font-semibold text-gray-900">Price Range</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={priceRange.min || ''}
                onChange={(event) =>
                  setPriceRange({ ...priceRange, min: Number(event.target.value) })
                }
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Max"
                value={priceRange.max || ''}
                onChange={(event) =>
                  setPriceRange({ ...priceRange, max: Number(event.target.value) })
                }
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="mb-6">
            <h3 className="mb-3 font-semibold text-gray-900">Prescription</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="prescription"
                  checked={showPrescriptionOnly === null}
                  onChange={() => setShowPrescriptionOnly(null)}
                  className="text-emerald-600"
                />
                <span>All Products</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="prescription"
                  checked={showPrescriptionOnly === false}
                  onChange={() => setShowPrescriptionOnly(false)}
                  className="text-emerald-600"
                />
                <span>No Prescription</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="prescription"
                  checked={showPrescriptionOnly === true}
                  onChange={() => setShowPrescriptionOnly(true)}
                  className="text-emerald-600"
                />
                <span>Prescription Required</span>
              </label>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={clearFilters}>
            Clear Filters
          </Button>

          <div className="mt-4 md:hidden">
            <Button className="w-full" onClick={() => setShowFilters(false)}>
              Apply Filters
            </Button>
          </div>
        </aside>

        <div className="flex-1">
          {isLoading && products.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-lg text-gray-500">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-lg text-gray-500">No products found</p>
              <p className="mt-2 text-gray-400">Try adjusting your search or filter criteria</p>
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => {
                const imageCount = getProductImages(product).length;

                return (
                  <Link key={product.id} to={`/product/${product.id}`}>
                    <Card hover className="h-full">
                      <div className="relative aspect-square overflow-hidden rounded-t-xl bg-gray-100">
                        <ProductImage
                          src={getPrimaryProductImage(product)}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                        {product.requiresPrescription && (
                          <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-2 py-1 text-xs text-white">
                            Rx Required
                          </span>
                        )}
                        {imageCount > 1 && (
                          <span className="absolute bottom-3 left-3 rounded-full bg-slate-900/80 px-2 py-1 text-xs text-white">
                            {imageCount} images
                          </span>
                        )}
                        {/* <button className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow transition-colors hover:bg-red-50">
                          <Heart className="h-4 w-4 text-gray-400 hover:text-red-500" />
                        </button> */}
                      </div>
                      <CardContent>
                        <p className="mb-1 text-sm text-emerald-600">{product.category}</p>
                        <h3 className="mb-2 line-clamp-2 font-semibold text-gray-900">
                          {product.name}
                        </h3>
                        <p className="mb-2 text-sm text-gray-500">{product.manufacturer}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(product.price)}
                          </p>
                          <Button size="sm" onClick={(event) => void handleAddToCart(event, product)}>
                            <ShoppingCart className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product) => {
                const imageCount = getProductImages(product).length;

                return (
                  <Link key={product.id} to={`/product/${product.id}`}>
                    <Card hover>
                      <div className="flex gap-4 p-4">
                        <div className="h-32 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          <ProductImage
                            src={getPrimaryProductImage(product)}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="mb-1 text-sm text-emerald-600">{product.category}</p>
                              <h3 className="mb-1 font-semibold text-gray-900">{product.name}</h3>
                              <p className="mb-2 text-sm text-gray-500">
                                {product.manufacturer}
                                {product.dosage ? ` • ${product.dosage}` : ''}
                              </p>
                              {product.requiresPrescription && (
                                <span className="inline-block rounded bg-amber-100 px-2 py-1 text-xs text-amber-700">
                                  Prescription Required
                                </span>
                              )}
                              {imageCount > 1 && (
                                <p className="mt-2 text-xs text-gray-500">
                                  {imageCount} product images available
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-gray-900">
                                {formatCurrency(product.price)}
                              </p>
                              <Button
                                size="sm"
                                className="mt-2"
                                onClick={(event) => void handleAddToCart(event, product)}
                              >
                                Add to Cart
                              </Button>
                            </div>
                          </div>
                          <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                            {product.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
