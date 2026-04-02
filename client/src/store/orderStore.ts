import { create } from 'zustand';
import {
  createOrder,
  createPaymentOrder,
  fetchAllOrders,
  fetchMyOrders,
  updateOrderStatus,
  verifyPayment,
} from '../lib/api';
import { Address, CartItem, Order } from '../types';

interface PaymentResult {
  message?: string;
  order?: Order;
  orderId?: string;
  amount?: number;
  currency?: string;
  key?: string;
}

interface OrderStore {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  createOrder: (
    items: CartItem[],
    shippingAddress: Address,
    prescriptionId?: string,
    paymentMethod?: 'online' | 'cod',
  ) => Promise<Order>;
  createPaymentForOrder: (orderId: string) => Promise<PaymentResult>;
  verifyPaymentForOrder: (input: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => Promise<Order>;
  fetchUserOrders: () => Promise<void>;
  fetchAllOrders: () => Promise<void>;
  getUserOrders: (userId: string) => Order[];
  getAllOrders: () => Order[];
  updateOrderStatus: (orderId: string, status: Order['orderStatus']) => Promise<void>;
}

const upsertOrder = (orders: Order[], order: Order) => {
  const existingOrder = orders.find((item) => item.id === order.id);
  if (!existingOrder) {
    return [order, ...orders];
  }

  return orders.map((item) => (item.id === order.id ? order : item));
};

export const useOrderStore = create<OrderStore>()((set, get) => ({
  orders: [],
  isLoading: false,
  error: null,

  createOrder: async (items: CartItem[], shippingAddress: Address, prescriptionId?: string, paymentMethod?: 'online' | 'cod') => {
    set({ isLoading: true, error: null });
    try {
      const order = await createOrder(items, shippingAddress, prescriptionId, paymentMethod);
      set((state) => ({
        orders: upsertOrder(state.orders, order),
        isLoading: false,
      }));
      return order;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create order';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  createPaymentForOrder: async (orderId: string) => {
    set({ isLoading: true, error: null });
    try {
      const paymentResult = await createPaymentOrder(orderId);
      set((state) => ({
        orders: paymentResult.order
          ? upsertOrder(state.orders, paymentResult.order)
          : state.orders,
        isLoading: false,
      }));
      return paymentResult;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create payment order';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  verifyPaymentForOrder: async (input) => {
    set({ isLoading: true, error: null });
    try {
      const order = await verifyPayment(input);
      set((state) => ({
        orders: upsertOrder(state.orders, order),
        isLoading: false,
      }));
      return order;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to verify payment';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  fetchUserOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const orders = await fetchMyOrders();
      set({ orders, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch orders',
        isLoading: false,
      });
    }
  },

  fetchAllOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const orders = await fetchAllOrders();
      set({ orders, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch orders',
        isLoading: false,
      });
    }
  },

  getUserOrders: (userId: string) => {
    return get().orders.filter((order) => order.userId === userId);
  },

  getAllOrders: () => {
    return get().orders;
  },

  updateOrderStatus: async (orderId: string, status: Order['orderStatus']) => {
    set({ isLoading: true, error: null });
    try {
      const order = await updateOrderStatus(orderId, status);
      set((state) => ({
        orders: upsertOrder(state.orders, order),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update order',
        isLoading: false,
      });
      throw error;
    }
  },
}));
