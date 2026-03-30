import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Heart,
  Minus,
  Plus,
  Shield,
  ShoppingCart,
  Truck,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ProductImage } from '../components/ui/ProductImage';
import { useProductStore } from '../store/productStore';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { formatCurrency } from '../utils/formatters';
import { getPrimaryProductImage, getProductImages } from '../utils/product';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState('');

  const { fetchProductById, getProduct, isLoading, products } = useProductStore();
  const { addToCart } = useCartStore();
  const { user } = useAuthStore();

  const product = getProduct(id || '');

  useEffect(() => {
    if (id) {
      void fetchProductById(id);
    }
  }, [fetchProductById, id]);

  useEffect(() => {
    if (product) {
      setSelectedImage(getPrimaryProductImage(product));
    }
  }, [product]);

  if (!product && isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">Loading product...</h1>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">Product Not Found</h1>
        <p className="mb-8 text-gray-600">The product you're looking for doesn't exist.</p>
        <Link to="/products">
          <Button>Browse Products</Button>
        </Link>
      </div>
    );
  }

  const productImages = getProductImages(product);
  const activeImage = selectedImage || getPrimaryProductImage(product);
  const relatedProducts = products
    .filter((candidate) => candidate.category === product.category && candidate.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = async () => {
    if (!user) {
      alert('Please login to add items to cart');
      return;
    }

    try {
      await addToCart(user.id, product, quantity);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to add this item to cart.');
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      alert('Please login to add items to cart');
      return;
    }

    try {
      await addToCart(user.id, product, quantity);
      navigate('/cart');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to add this item to cart.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link to="/" className="hover:text-emerald-600">
          Home
        </Link>
        <span>/</span>
        <Link to="/products" className="hover:text-emerald-600">
          Products
        </Link>
        <span>/</span>
        <Link to={`/products?category=${product.category}`} className="hover:text-emerald-600">
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-emerald-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="mb-12 grid gap-8 lg:grid-cols-2">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100">
            <ProductImage
              src={activeImage}
              alt={product.name}
              className="h-full w-full object-cover"
            />
            {product.requiresPrescription && (
              <div className="absolute left-4 top-4 rounded-full bg-amber-500 px-3 py-1 text-sm font-medium text-white">
                Prescription Required
              </div>
            )}
            <button className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow transition-colors hover:bg-red-50">
              <Heart className="h-5 w-5 text-gray-400 hover:text-red-500" />
            </button>
          </div>

          {productImages.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
              {productImages.map((imageUrl) => (
                <button
                  key={imageUrl}
                  type="button"
                  onClick={() => setSelectedImage(imageUrl)}
                  className={`overflow-hidden rounded-xl border ${
                    activeImage === imageUrl
                      ? 'border-emerald-500 ring-2 ring-emerald-100'
                      : 'border-transparent'
                  }`}
                >
                  <ProductImage
                    src={imageUrl}
                    alt={product.name}
                    className="h-20 w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <Badge variant="info" className="mb-3">
            {product.category}
          </Badge>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">{product.name}</h1>
          <p className="mb-4 text-gray-500">by {product.manufacturer}</p>

          <div className="mb-6">
            <span className="text-3xl font-bold text-gray-900">
              {formatCurrency(product.price)}
            </span>
            <span className="ml-2 text-gray-500">per pack</span>
          </div>

          <div className="mb-6">
            {product.stock > 0 ? (
              <Badge variant="success">In Stock ({product.stock} available)</Badge>
            ) : (
              <Badge variant="danger">Out of Stock</Badge>
            )}
          </div>

          {product.requiresPrescription && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" />
                <div>
                  <h4 className="font-medium text-amber-800">Prescription Required</h4>
                  <p className="mt-1 text-sm text-amber-700">
                    This medicine requires a valid prescription. Please{' '}
                    <Link to="/upload-prescription" className="underline">
                      upload your prescription
                    </Link>{' '}
                    before checkout.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6 flex items-center gap-4">
            <span className="text-gray-700">Quantity:</span>
            <div className="flex items-center rounded-lg border">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="rounded-l-lg p-2 hover:bg-gray-100"
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="px-4 py-2 font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="rounded-r-lg p-2 hover:bg-gray-100"
                disabled={quantity >= product.stock}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mb-8 flex gap-4">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => void handleAddToCart()}
              disabled={product.stock === 0}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>
            <Button
              size="lg"
              className="flex-1"
              onClick={() => void handleBuyNow()}
              disabled={product.stock === 0}
            >
              Buy Now
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <Truck className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm font-medium">Free Delivery</p>
                <p className="text-xs text-gray-500">On orders above INR 500</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <Shield className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm font-medium">100% Genuine</p>
                <p className="text-xs text-gray-500">Certified products</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <div className="prose max-w-none">
          <p className="mb-4 text-gray-600">{product.description}</p>
          <h3 className="mb-3 mt-6 text-lg font-semibold text-gray-900">Product Details</h3>
          <table className="min-w-full">
            <tbody>
              <tr className="border-b">
                <td className="w-40 py-2 text-gray-500">Manufacturer</td>
                <td className="py-2 text-gray-900">{product.manufacturer}</td>
              </tr>
              {product.dosage && (
                <tr className="border-b">
                  <td className="py-2 text-gray-500">Dosage</td>
                  <td className="py-2 text-gray-900">{product.dosage}</td>
                </tr>
              )}
              <tr className="border-b">
                <td className="py-2 text-gray-500">Category</td>
                <td className="py-2 text-gray-900">{product.category}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 text-gray-500">Prescription</td>
                <td className="py-2 text-gray-900">
                  {product.requiresPrescription ? 'Required' : 'Not Required'}
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 text-gray-500">Gallery</td>
                <td className="py-2 text-gray-900">
                  {productImages.length > 0 ? `${productImages.length} image(s)` : 'No images'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div>
          <h2 className="mb-6 text-2xl font-bold text-gray-900">Related Products</h2>
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {relatedProducts.map((relatedProduct) => (
              <Link key={relatedProduct.id} to={`/product/${relatedProduct.id}`}>
                <Card hover>
                  <div className="aspect-square overflow-hidden rounded-t-xl bg-gray-100">
                    <ProductImage
                      src={getPrimaryProductImage(relatedProduct)}
                      alt={relatedProduct.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <CardContent>
                    <h3 className="mb-2 line-clamp-2 font-medium text-gray-900">
                      {relatedProduct.name}
                    </h3>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(relatedProduct.price)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
