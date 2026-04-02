// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Product Types
export interface ProductInput {
  name: string;
  price: number;
  category: string;
  description: string;
  image?: string;
  images?: string[];
  imageFiles?: File[];
  stock: number;
  requiresPrescription: boolean;
  manufacturer: string;
  dosage: string;
  subtitle?: string;
  featured?: boolean;
}

export interface Product extends ProductInput {
  id: string;
  image: string;
  images: string[];
}

export interface ProductImportSummary {
  total: number;
  created: number;
  updated: number;
  errors: string[];
}

// Cart Types
export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  shippingAddress: Address | null;
}

// Prescription Types
export interface Prescription {
  id: string;
  userId: string;
  userName: string;
  fileUrl: string;
  fileName: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  notes?: string;
}

// Order Types
export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  items: OrderItem[];
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'cod';
  paymentMethod: 'online' | 'cod';
  orderStatus: 'pending_approval' | 'approved' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  prescriptionId?: string;
  shippingAddress: Address;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
