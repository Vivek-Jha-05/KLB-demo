import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Download,
  Edit2,
  Package,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { useProductStore } from '../../store/productStore';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { ProductImage } from '../../components/ui/ProductImage';
import { Product, ProductInput } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { buildProductsCsv, parseProductImportFile } from '../../utils/productImportExport';
import { getPrimaryProductImage, getProductImages } from '../../utils/product';

interface ProductFormData {
  name: string;
  price: string;
  category: string;
  description: string;
  existingImages: string[];
  stock: string;
  requiresPrescription: boolean;
  manufacturer: string;
  dosage: string;
}

interface FeedbackState {
  type: 'success' | 'error';
  message: string;
}

const initialFormData: ProductFormData = {
  name: '',
  price: '',
  category: 'General Health',
  description: '',
  existingImages: [],
  stock: '',
  requiresPrescription: false,
  manufacturer: '',
  dosage: '',
};

export const AdminProductsPage: React.FC = () => {
  const {
    addProduct,
    deleteProduct,
    fetchProducts,
    importProducts,
    isLoading,
    products,
    updateProduct,
  } = useProductStore();

  const importInputRef = useRef<HTMLInputElement | null>(null);
  const productImageInputRef = useRef<HTMLInputElement | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (selectedImageFiles.length === 0) {
      setPreviewUrls([]);
      return undefined;
    }

    const objectUrls = selectedImageFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(objectUrls);

    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedImageFiles]);

  const categoryOptions = useMemo(() => {
    return Array.from(
      new Set([formData.category, ...products.map((product) => product.category)].filter(Boolean)),
    ).sort();
  }, [formData.category, products]);

  const filteredProducts = products.filter((product) => {
    const normalizedSearch = searchQuery.toLowerCase();
    const matchesSearch =
      product.name.toLowerCase().includes(normalizedSearch) ||
      product.manufacturer.toLowerCase().includes(normalizedSearch);
    const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
    const matchesStock =
      stockFilter === 'all' ||
      (stockFilter === 'low' && product.stock > 0 && product.stock <= 10) ||
      (stockFilter === 'out' && product.stock === 0);

    return matchesSearch && matchesCategory && matchesStock;
  });

  const stats = {
    total: products.length,
    inStock: products.filter((product) => product.stock > 10).length,
    lowStock: products.filter((product) => product.stock > 0 && product.stock <= 10).length,
    outOfStock: products.filter((product) => product.stock === 0).length,
    prescriptionRequired: products.filter((product) => product.requiresPrescription).length,
  };

  const previewImages = previewUrls.length > 0 ? previewUrls : formData.existingImages;

  const resetImageSelection = () => {
    setSelectedImageFiles([]);
    if (productImageInputRef.current) {
      productImageInputRef.current.value = '';
    }
  };

  const handleOpenModal = (product?: Product) => {
    setFeedback(null);
    resetImageSelection();

    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        category: product.category,
        description: product.description,
        existingImages: getProductImages(product),
        stock: product.stock.toString(),
        requiresPrescription: product.requiresPrescription,
        manufacturer: product.manufacturer,
        dosage: product.dosage,
      });
    } else {
      setEditingProduct(null);
      setFormData(initialFormData);
    }

    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData(initialFormData);
    resetImageSelection();
  };

  const handleImageSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setSelectedImageFiles(files);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const productData: ProductInput = {
      name: formData.name.trim(),
      price: Number(formData.price),
      category: formData.category,
      description: formData.description.trim(),
      image: selectedImageFiles.length === 0 ? formData.existingImages[0] ?? '' : undefined,
      images: selectedImageFiles.length === 0 ? formData.existingImages : undefined,
      imageFiles: selectedImageFiles.length > 0 ? selectedImageFiles : undefined,
      stock: Number(formData.stock),
      requiresPrescription: formData.requiresPrescription,
      manufacturer: formData.manufacturer.trim(),
      dosage: formData.dosage.trim(),
    };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        setFeedback({ type: 'success', message: 'Product updated successfully.' });
      } else {
        await addProduct(productData);
        setFeedback({ type: 'success', message: 'Product added successfully.' });
      }

      handleCloseModal();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to save product.',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      setDeleteConfirm(null);
      setFeedback({ type: 'success', message: 'Product deleted successfully.' });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to delete product.',
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedProducts.map((id) => deleteProduct(id)));
      setSelectedProducts([]);
      setFeedback({ type: 'success', message: 'Selected products deleted successfully.' });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to delete selected products.',
      });
    }
  };

  const handleExport = () => {
    const csvContent = buildProductsCsv(products);
    const file = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');

    link.href = url;
    link.download = `products-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    setFeedback({ type: 'success', message: `Exported ${products.length} products to CSV.` });
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    try {
      const parsedProducts = await parseProductImportFile(file);
      const summary = await importProducts(parsedProducts);
      const skippedCount = summary.errors.length;

      setFeedback({
        type: skippedCount > 0 ? 'error' : 'success',
        message:
          `${summary.created} created, ${summary.updated} updated` +
          (skippedCount > 0
            ? `. ${skippedCount} row(s) skipped. ${summary.errors[0]}`
            : '.'),
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to import products.',
      });
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedProducts((previousSelection) =>
      previousSelection.includes(id)
        ? previousSelection.filter((productId) => productId !== id)
        : [...previousSelection, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
      return;
    }

    setSelectedProducts(filteredProducts.map((product) => product.id));
  };

  return (
    <div className="space-y-6">
      <input
        ref={importInputRef}
        type="file"
        accept=".csv,.json"
        className="hidden"
        onChange={handleImportChange}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600">Manage your inventory and product catalog</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handleImportClick}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV/JSON
          </Button>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Products</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">{stats.inStock}</div>
            <div className="text-sm text-gray-600">In Stock</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.lowStock}</div>
            <div className="text-sm text-gray-600">Low Stock</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
            <div className="text-sm text-gray-600">Out of Stock</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.prescriptionRequired}</div>
            <div className="text-sm text-gray-600">Rx Required</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products by name or manufacturer..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">All Categories</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={stockFilter}
              onChange={(event) => setStockFilter(event.target.value as 'all' | 'low' | 'out')}
              className="rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Stock Levels</option>
              <option value="low">Low Stock (&lt;=10)</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            Import accepts `.csv` or `.json`. The admin editor now uploads image files directly,
            while import/export still uses image paths in the `images` column.
          </p>
        </CardContent>
      </Card>

      {selectedProducts.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <span className="text-emerald-800">{selectedProducts.length} product(s) selected</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedProducts([])}>
              Clear Selection
            </Button>
            <Button variant="danger" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Product</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Price</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Stock</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProducts.map((product) => {
                const productImages = getProductImages(product);

                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleSelectProduct(product.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <ProductImage
                            src={getPrimaryProductImage(product)}
                            alt={product.name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                          {productImages.length > 1 && (
                            <span className="absolute -bottom-1 -right-1 rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] font-medium text-white">
                              +{productImages.length - 1}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.manufacturer}</div>
                          {product.requiresPrescription && (
                            <span className="mt-1 inline-block rounded bg-orange-100 px-2 py-0.5 text-xs text-orange-700">
                              Rx Required
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{product.category}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{formatCurrency(product.price)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium ${
                            product.stock === 0
                              ? 'text-red-600'
                              : product.stock <= 10
                                ? 'text-yellow-600'
                                : 'text-gray-900'
                          }`}
                        >
                          {product.stock}
                        </span>
                        {product.stock === 0 && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        {product.stock > 0 && product.stock <= 10 && (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {product.stock === 0 ? (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                          Out of Stock
                        </span>
                      ) : product.stock <= 10 ? (
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                          <Check className="mr-1 h-3 w-3" />
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(product)}
                          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(product.id)}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="py-12 text-center">
              <Package className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p className="text-gray-500">No products found</p>
            </div>
          )}
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="Product Name"
                value={formData.name}
                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                required
              />
            </div>
            <Input
              label="Price (INR)"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(event) => setFormData({ ...formData, price: event.target.value })}
              required
            />
            <Input
              label="Stock Quantity"
              type="number"
              min="0"
              value={formData.stock}
              onChange={(event) => setFormData({ ...formData, stock: event.target.value })}
              required
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
              <select
                value={formData.category}
                onChange={(event) => setFormData({ ...formData, category: event.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Manufacturer"
              value={formData.manufacturer}
              onChange={(event) => setFormData({ ...formData, manufacturer: event.target.value })}
              required
            />
            <div className="col-span-2">
              <Input
                label="Dosage"
                value={formData.dosage}
                onChange={(event) => setFormData({ ...formData, dosage: event.target.value })}
                placeholder="e.g. 500mg, 10ml"
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Product Images</label>
              <input
                ref={productImageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelection}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:font-medium file:text-emerald-700 hover:file:bg-emerald-100"
              />
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span>
                  {selectedImageFiles.length > 0
                    ? `${selectedImageFiles.length} new image file(s) selected`
                    : formData.existingImages.length > 0
                      ? `${formData.existingImages.length} current image(s)`
                      : 'No images selected yet'}
                </span>
                {selectedImageFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={resetImageSelection}
                    className="font-medium text-emerald-700 hover:underline"
                  >
                    Use current images
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Choose one or more image files. When editing, selecting new files replaces the
                current product gallery.
              </p>
            </div>
            {previewImages.length > 0 && (
              <div className="col-span-2">
                <p className="mb-2 text-sm font-medium text-gray-700">Preview</p>
                <div className="grid grid-cols-4 gap-3">
                  {previewImages.map((imageUrl, index) => (
                    <ProductImage
                      key={`${imageUrl}-${index}`}
                      src={imageUrl}
                      alt={formData.name || 'Product preview'}
                      className="h-20 w-full rounded-lg object-cover"
                    />
                  ))}
                </div>
              </div>
            )}
            <div className="col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.requiresPrescription}
                  onChange={(event) =>
                    setFormData({ ...formData, requiresPrescription: event.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Requires Prescription</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button variant="outline" type="button" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {editingProduct ? 'Update Product' : 'Add Product'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Delete">
        <div className="py-4">
          <div className="flex items-center gap-4 text-gray-600">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <p>Are you sure you want to delete this product? This action cannot be undone.</p>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              Delete Product
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
