import { create } from 'zustand';
import {
  addCartItem as addCartItemApi,
  clearCart as clearCartApi,
  fetchMyCart,
  removeCartItem as removeCartItemApi,
  updateCartItem as updateCartItemApi,
  updateCartShippingAddress,
} from '../lib/api';
import { Address, CartItem, Product } from '../types';

interface CartStore {
  items: CartItem[];
  shippingAddress: Address | null;
  isLoading: boolean;
  error: string | null;
  fetchCart: (userId?: string) => Promise<void>;
  addToCart: (userId: string, product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (userId: string, productId: string) => Promise<void>;
  updateQuantity: (userId: string, productId: string, quantity: number) => Promise<void>;
  clearCart: (userId?: string) => Promise<void>;
  setShippingAddress: (userId: string, address: Address) => Promise<void>;
  getItems: (userId?: string) => CartItem[];
  getTotal: (userId?: string) => number;
  getItemCount: (userId?: string) => number;
  hasPrescriptionItems: (userId?: string) => boolean;
  getShippingAddress: (userId?: string) => Address | null;
  reset: () => void;
}

const setCartState = (
  set: (state: Partial<CartStore> | ((state: CartStore) => Partial<CartStore>)) => void,
  cart: { items: CartItem[]; shippingAddress: Address | null },
) => {
  set({
    items: cart.items,
    shippingAddress: cart.shippingAddress,
    isLoading: false,
    error: null,
  });
};

export const useCartStore = create<CartStore>()((set, get) => ({
  items: [],
  shippingAddress: null,
  isLoading: false,
  error: null,

  fetchCart: async (userId?: string) => {
    if (!userId) {
      set({ items: [], shippingAddress: null, error: null, isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const cart = await fetchMyCart();
      setCartState(set, cart);
    } catch (error) {
      set({
        items: [],
        shippingAddress: null,
        error: error instanceof Error ? error.message : 'Failed to fetch cart',
        isLoading: false,
      });
    }
  },

  addToCart: async (userId: string, product: Product, quantity: number = 1) => {
    if (!userId) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const cart = await addCartItemApi(product.id, quantity);
      setCartState(set, cart);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to add item to cart',
        isLoading: false,
      });
      throw error;
    }
  },

  removeFromCart: async (userId: string, productId: string) => {
    if (!userId) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const cart = await removeCartItemApi(productId);
      setCartState(set, cart);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to remove item from cart',
        isLoading: false,
      });
      throw error;
    }
  },

  updateQuantity: async (userId: string, productId: string, quantity: number) => {
    if (!userId || quantity < 1) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const cart = await updateCartItemApi(productId, quantity);
      setCartState(set, cart);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update cart quantity',
        isLoading: false,
      });
      throw error;
    }
  },

  clearCart: async (userId?: string) => {
    if (!userId) {
      set({ items: [], shippingAddress: null, error: null, isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const cart = await clearCartApi();
      setCartState(set, cart);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to clear cart',
        isLoading: false,
      });
      throw error;
    }
  },

  setShippingAddress: async (userId: string, address: Address) => {
    if (!userId) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const cart = await updateCartShippingAddress(address);
      setCartState(set, cart);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to save shipping address',
        isLoading: false,
      });
      throw error;
    }
  },

  getItems: (userId?: string) => {
    if (!userId) {
      return [];
    }

    return get().items;
  },

  getTotal: (userId?: string) => {
    if (!userId) {
      return 0;
    }

    return get().items.reduce((total, item) => total + item.product.price * item.quantity, 0);
  },

  getItemCount: (userId?: string) => {
    if (!userId) {
      return 0;
    }

    return get().items.reduce((count, item) => count + item.quantity, 0);
  },

  hasPrescriptionItems: (userId?: string) => {
    if (!userId) {
      return false;
    }

    return get().items.some((item) => item.product.requiresPrescription);
  },

  getShippingAddress: (userId?: string) => {
    if (!userId) {
      return null;
    }

    return get().shippingAddress;
  },

  reset: () => {
    set({
      items: [],
      shippingAddress: null,
      isLoading: false,
      error: null,
    });
  },
}));
