import { create } from 'zustand';
import {
  createProduct,
  deleteProduct,
  fetchProductById,
  fetchProducts,
  importProducts as importProductsApi,
  updateProduct,
} from '../lib/api';
import { Product, ProductImportSummary, ProductInput } from '../types';

interface ProductStore {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  fetchProductById: (id: string) => Promise<Product | null>;
  getProduct: (id: string) => Product | undefined;
  addProduct: (product: ProductInput) => Promise<Product>;
  updateProduct: (id: string, updates: ProductInput) => Promise<void>;
  importProducts: (products: ProductInput[]) => Promise<ProductImportSummary>;
  deleteProduct: (id: string) => Promise<void>;
  searchProducts: (query: string) => Product[];
  filterByCategory: (category: string) => Product[];
}

export const useProductStore = create<ProductStore>()((set, get) => ({
  products: [],
  isLoading: false,
  error: null,

  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const products = await fetchProducts();
      set({ products, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch products',
        isLoading: false,
      });
    }
  },

  fetchProductById: async (id: string) => {
    const existingProduct = get().products.find((product) => product.id === id);
    if (existingProduct) {
      return existingProduct;
    }

    set({ isLoading: true, error: null });
    try {
      const product = await fetchProductById(id);
      set((state) => ({
        products: [...state.products.filter((item) => item.id !== product.id), product],
        isLoading: false,
      }));
      return product;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch product',
        isLoading: false,
      });
      return null;
    }
  },

  getProduct: (id: string) => {
    return get().products.find((product) => product.id === id);
  },

  addProduct: async (product: ProductInput) => {
    set({ isLoading: true, error: null });
    try {
      const createdProduct = await createProduct(product);
      set((state) => ({
        products: [createdProduct, ...state.products],
        isLoading: false,
      }));
      return createdProduct;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add product';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateProduct: async (id: string, updates: ProductInput) => {
    set({ isLoading: true, error: null });
    try {
      const updatedProduct = await updateProduct(id, updates);
      set((state) => ({
        products: state.products.map((product) =>
          product.id === id ? updatedProduct : product,
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update product',
        isLoading: false,
      });
      throw error;
    }
  },

  importProducts: async (productsToImport: ProductInput[]) => {
    set({ isLoading: true, error: null });
    try {
      const summary = await importProductsApi(productsToImport);
      const products = await fetchProducts();
      set({ products, isLoading: false });
      return summary;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import products';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteProduct: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await deleteProduct(id);
      set((state) => ({
        products: state.products.filter((product) => product.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete product',
        isLoading: false,
      });
      throw error;
    }
  },

  searchProducts: (query: string) => {
    const normalizedQuery = query.toLowerCase();
    return get().products.filter((product) => {
      return (
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.category.toLowerCase().includes(normalizedQuery) ||
        product.description.toLowerCase().includes(normalizedQuery) ||
        product.manufacturer.toLowerCase().includes(normalizedQuery)
      );
    });
  },

  filterByCategory: (category: string) => {
    if (category === 'All') {
      return get().products;
    }

    return get().products.filter((product) => product.category === category);
  },
}));
