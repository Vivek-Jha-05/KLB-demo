import type {
  Address,
  Cart,
  CartItem,
  Order,
  Prescription,
  Product,
  ProductImportSummary,
  ProductInput,
  User,
} from '../types';

const DEFAULT_API_BASE_URL = '/api';
const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ||
  DEFAULT_API_BASE_URL;
const AUTH_STORAGE_KEY = 'auth-storage';

type Role = User['role'];
type PaymentStatus = Order['paymentStatus'];
type OrderStatus = Order['orderStatus'];
type PrescriptionStatus = Prescription['status'];

interface PersistedAuthState {
  state?: {
    token?: string | null;
  };
  token?: string | null;
}

interface ApiUser {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  createdAt?: string;
  token?: string;
}

interface ApiProduct {
  _id?: string;
  id?: string;
  name?: string;
  price?: number;
  category?: string;
  description?: string;
  image?: string;
  images?: string[];
  stock?: number;
  requiresPrescription?: boolean;
  manufacturer?: string;
  dosage?: string;
  subtitle?: string;
  featured?: boolean;
}

interface ApiPrescription {
  _id?: string;
  id?: string;
  userId?: string | ApiUser;
  userName?: string;
  fileUrl?: string;
  fileName?: string;
  originalName?: string;
  status?: string;
  reviewedBy?: string | ApiUser | null;
  reviewedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  reviewNote?: string;
  notes?: string;
}

interface ApiOrderItem {
  productId?: string | ApiProduct;
  productName?: string;
  name?: string;
  price?: number;
  quantity?: number;
  image?: string;
}

interface ApiOrder {
  _id?: string;
  id?: string;
  userId?: string | ApiUser;
  userName?: string;
  products?: ApiOrderItem[];
  items?: ApiOrderItem[];
  totalAmount?: number;
  paymentStatus?: string;
  orderStatus?: string;
  prescriptionId?: string | { _id?: string; id?: string } | null;
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    zip?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface ApiCartItem {
  productId?: string | ApiProduct | null;
  quantity?: number;
}

interface ApiCart {
  items?: ApiCartItem[];
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    zip?: string;
  };
}

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

type RequestBody = BodyInit | FormData | Record<string, unknown> | undefined;

interface RequestOptions extends Omit<RequestInit, 'body'> {
  auth?: boolean;
  body?: RequestBody;
}

interface AuthResult {
  user: User;
  token: string;
}

interface ReviewPrescriptionInput {
  status: 'approved' | 'rejected';
  notes?: string;
}

interface PaymentOrderResult {
  message?: string;
  order?: Order;
  orderId?: string;
  amount?: number;
  currency?: string;
  key?: string;
}

type VerifyPaymentInput = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

const VALID_ORDER_STATUSES: OrderStatus[] = [
  'pending_approval',
  'approved',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

const VALID_PAYMENT_STATUSES: PaymentStatus[] = ['pending', 'paid', 'failed', 'refunded'];
const VALID_PRESCRIPTION_STATUSES: PrescriptionStatus[] = ['pending', 'approved', 'rejected'];

const buildApiPath = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

const getStoredToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as PersistedAuthState;
    return parsed.state?.token ?? parsed.token ?? null;
  } catch {
    return null;
  }
};

const getApiOrigin = () => {
  if (!isAbsoluteUrl(API_BASE_URL)) {
    return '';
  }

  return API_BASE_URL.replace(/\/api\/?$/i, '');
};

export const resolveAssetUrl = (path: string) => {
  if (!path) {
    return '';
  }

  if (isAbsoluteUrl(path)) {
    return path;
  }

  const apiOrigin = getApiOrigin();
  if (!apiOrigin) {
    return path;
  }

  return new URL(path, `${apiOrigin}/`).toString();
};

const extractMessage = (payload: unknown, fallback: string) => {
  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return fallback;
};

const toId = (value: string | { _id?: string; id?: string } | null | undefined) => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  return value.id ?? value._id ?? '';
};

const normalizeRole = (role: string | undefined): Role => (role === 'admin' ? 'admin' : 'user');

const normalizeOrderStatus = (status: string | undefined): OrderStatus => {
  if (status && VALID_ORDER_STATUSES.includes(status as OrderStatus)) {
    return status as OrderStatus;
  }

  return 'processing';
};

const normalizePaymentStatus = (status: string | undefined): PaymentStatus => {
  if (status && VALID_PAYMENT_STATUSES.includes(status as PaymentStatus)) {
    return status as PaymentStatus;
  }

  return 'pending';
};

const normalizePrescriptionStatus = (status: string | undefined): PrescriptionStatus => {
  if (status && VALID_PRESCRIPTION_STATUSES.includes(status as PrescriptionStatus)) {
    return status as PrescriptionStatus;
  }

  return 'pending';
};

const normalizeUser = (user: ApiUser): User => ({
  id: toId(user),
  name: user.name ?? '',
  email: user.email ?? '',
  role: normalizeRole(user.role),
  createdAt: user.createdAt ?? new Date().toISOString(),
});

const normalizeAddress = (
  address:
    | {
        fullName?: string;
        phone?: string;
        street?: string;
        city?: string;
        state?: string;
        pincode?: string;
        zip?: string;
      }
    | null
    | undefined,
): Address | null => {
  const normalizedAddress: Address = {
    fullName: address?.fullName ?? '',
    phone: address?.phone ?? '',
    street: address?.street ?? '',
    city: address?.city ?? '',
    state: address?.state ?? '',
    pincode: address?.pincode ?? address?.zip ?? '',
  };

  return Object.values(normalizedAddress).some((value) => value.trim()) ? normalizedAddress : null;
};

const normalizeProduct = (product: ApiProduct): Product => {
  const resolvedImages = Array.from(
    new Set(
      (product.images ?? [])
        .map((image) => resolveAssetUrl(image ?? ''))
        .filter(Boolean),
    ),
  );
  const primaryImage = resolveAssetUrl(product.image ?? resolvedImages[0] ?? '');
  const images = Array.from(new Set([primaryImage, ...resolvedImages].filter(Boolean)));

  return {
    id: toId(product),
    name: product.name ?? '',
    price: Number(product.price ?? 0),
    category: product.category ?? 'General Health',
    description: product.description ?? '',
    image: primaryImage || images[0] || '',
    images,
    stock: Number(product.stock ?? 0),
    requiresPrescription: Boolean(product.requiresPrescription),
    // UPDATED CONTENT
    manufacturer: product.manufacturer?.trim() || 'KLB Lifesciences Pvt. Ltd.',
    dosage: product.dosage?.trim() || product.subtitle?.trim() || '',
    subtitle: product.subtitle?.trim() || '',
    featured: Boolean(product.featured),
  };
};

const normalizePrescription = (prescription: ApiPrescription): Prescription => {
  const populatedUser =
    prescription.userId && typeof prescription.userId === 'object' ? prescription.userId : null;
  const populatedReviewer =
    prescription.reviewedBy && typeof prescription.reviewedBy === 'object'
      ? prescription.reviewedBy
      : null;

  return {
    id: toId(prescription),
    userId: toId(prescription.userId),
    userName: populatedUser?.name ?? prescription.userName ?? 'Customer',
    fileUrl: resolveAssetUrl(prescription.fileUrl ?? ''),
    fileName:
      prescription.originalName ??
      prescription.fileName ??
      prescription.fileUrl?.split('/').pop() ??
      'Prescription',
    status: normalizePrescriptionStatus(prescription.status),
    reviewedBy:
      populatedReviewer?.name ??
      (typeof prescription.reviewedBy === 'string' ? prescription.reviewedBy : null),
    reviewedAt:
      prescription.reviewedAt ??
      (normalizePrescriptionStatus(prescription.status) !== 'pending'
        ? prescription.updatedAt ?? null
        : null),
    createdAt: prescription.createdAt ?? new Date().toISOString(),
    notes: prescription.reviewNote ?? prescription.notes ?? undefined,
  };
};

const normalizeOrderItem = (item: ApiOrderItem) => ({
  productId: toId(item.productId),
  productName: item.productName ?? item.name ?? 'Product',
  price: Number(item.price ?? 0),
  quantity: Number(item.quantity ?? 0),
  image: resolveAssetUrl(item.image ?? ''),
});

const normalizeCartItem = (item: ApiCartItem): CartItem | null => {
  if (!item.productId || typeof item.productId === 'string') {
    return null;
  }

  const product = normalizeProduct(item.productId);
  if (!product.id) {
    return null;
  }

  return {
    product,
    quantity: Number(item.quantity ?? 0),
  };
};

const normalizeOrder = (order: ApiOrder): Order => {
  const populatedUser = order.userId && typeof order.userId === 'object' ? order.userId : null;
  const shippingAddress = order.shippingAddress ?? {};
  const items = Array.isArray(order.products)
    ? order.products.map(normalizeOrderItem)
    : Array.isArray(order.items)
      ? order.items.map(normalizeOrderItem)
      : [];

  return {
    id: toId(order),
    userId: toId(order.userId),
    userName: populatedUser?.name ?? order.userName ?? shippingAddress.fullName ?? 'Customer',
    items,
    totalAmount: Number(order.totalAmount ?? 0),
    paymentStatus: normalizePaymentStatus(order.paymentStatus),
    orderStatus: normalizeOrderStatus(order.orderStatus),
    prescriptionId: toId(order.prescriptionId) || undefined,
    shippingAddress: {
      fullName: shippingAddress.fullName ?? '',
      phone: shippingAddress.phone ?? '',
      street: shippingAddress.street ?? '',
      city: shippingAddress.city ?? '',
      state: shippingAddress.state ?? '',
      pincode: shippingAddress.pincode ?? shippingAddress.zip ?? '',
    },
    createdAt: order.createdAt ?? new Date().toISOString(),
    updatedAt: order.updatedAt ?? order.createdAt ?? new Date().toISOString(),
  };
};

const normalizeCart = (cart: ApiCart): Cart => ({
  items: Array.isArray(cart.items)
    ? cart.items
        .map(normalizeCartItem)
        .filter((item): item is CartItem => item !== null && item.quantity > 0)
    : [],
  shippingAddress: normalizeAddress(cart.shippingAddress),
});

const serializeProduct = (product: ProductInput) => {
  const rawImages = Array.isArray(product.images) ? product.images : [];
  const normalizedImages = Array.from(
    new Set(
      [product.image ?? '', ...rawImages]
        .map((image) => (typeof image === 'string' ? image.trim() : ''))
        .filter(Boolean),
    ),
  );

  return {
    name: product.name,
    price: product.price,
    category: product.category,
    description: product.description,
    image: normalizedImages[0] || '',
    images: normalizedImages,
    stock: product.stock,
    requiresPrescription: product.requiresPrescription,
    manufacturer: product.manufacturer,
    dosage: product.dosage,
    subtitle: product.subtitle ?? product.dosage,
    featured: Boolean(product.featured),
  };
};

const buildProductRequestBody = (product: ProductInput) => {
  const hasImageFiles = Array.isArray(product.imageFiles) && product.imageFiles.length > 0;

  if (!hasImageFiles) {
    return serializeProduct(product);
  }

  const formData = new FormData();
  const serializedProduct = serializeProduct(product);

  formData.append('name', serializedProduct.name);
  formData.append('price', `${serializedProduct.price}`);
  formData.append('category', serializedProduct.category);
  formData.append('description', serializedProduct.description);
  formData.append('stock', `${serializedProduct.stock}`);
  formData.append('requiresPrescription', `${serializedProduct.requiresPrescription}`);
  formData.append('manufacturer', serializedProduct.manufacturer);
  formData.append('dosage', serializedProduct.dosage);
  formData.append('subtitle', serializedProduct.subtitle);
  formData.append('featured', `${serializedProduct.featured}`);

  for (const imageFile of product.imageFiles ?? []) {
    formData.append('images', imageFile);
  }

  return formData;
};

const serializeShippingAddress = (address: Address) => ({
  fullName: address.fullName,
  phone: address.phone,
  street: address.street,
  city: address.city,
  state: address.state,
  zip: address.pincode,
});

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = options.auth ? getStoredToken() : null;

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (typeof options.body === 'string' || options.body instanceof Blob) {
    body = options.body;
  } else if (options.body) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    body = JSON.stringify(options.body);
  }

  const response = await fetch(buildApiPath(path), {
    ...options,
    headers,
    body,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? ((await response.json()) as unknown)
    : ((await response.text()) as unknown);

  if (!response.ok) {
    throw new ApiError(
      extractMessage(payload, `Request failed with status ${response.status}`),
      response.status,
      payload,
    );
  }

  return payload as T;
}

export const loginUser = async (email: string, password: string): Promise<AuthResult> => {
  const response = await apiRequest<ApiUser>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });

  return {
    user: normalizeUser(response),
    token: response.token ?? '',
  };
};

export const registerUser = async (
  name: string,
  email: string,
  password: string,
): Promise<AuthResult> => {
  const response = await apiRequest<ApiUser>('/auth/register', {
    method: 'POST',
    body: { name, email, password },
  });

  return {
    user: normalizeUser(response),
    token: response.token ?? '',
  };
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await apiRequest<ApiUser>('/auth/me', { auth: true });
  return normalizeUser(response);
};

export const fetchProducts = async (): Promise<Product[]> => {
  const response = await apiRequest<{ products?: ApiProduct[] }>('/products');
  return (response.products ?? []).map(normalizeProduct);
};

export const fetchMyCart = async (): Promise<Cart> => {
  const response = await apiRequest<ApiCart>('/cart', { auth: true });
  return normalizeCart(response);
};

export const addCartItem = async (productId: string, quantity: number): Promise<Cart> => {
  const response = await apiRequest<ApiCart>('/cart/items', {
    method: 'POST',
    auth: true,
    body: { productId, quantity },
  });

  return normalizeCart(response);
};

export const updateCartItem = async (productId: string, quantity: number): Promise<Cart> => {
  const response = await apiRequest<ApiCart>(`/cart/items/${productId}`, {
    method: 'PUT',
    auth: true,
    body: { quantity },
  });

  return normalizeCart(response);
};

export const removeCartItem = async (productId: string): Promise<Cart> => {
  const response = await apiRequest<ApiCart>(`/cart/items/${productId}`, {
    method: 'DELETE',
    auth: true,
  });

  return normalizeCart(response);
};

export const clearCart = async (): Promise<Cart> => {
  const response = await apiRequest<ApiCart>('/cart', {
    method: 'DELETE',
    auth: true,
  });

  return normalizeCart(response);
};

export const updateCartShippingAddress = async (address: Address): Promise<Cart> => {
  const response = await apiRequest<ApiCart>('/cart/shipping-address', {
    method: 'PUT',
    auth: true,
    body: serializeShippingAddress(address),
  });

  return normalizeCart(response);
};

export const fetchProductById = async (id: string): Promise<Product> => {
  const response = await apiRequest<ApiProduct>(`/products/${id}`);
  return normalizeProduct(response);
};

export const createProduct = async (product: ProductInput): Promise<Product> => {
  const response = await apiRequest<ApiProduct>('/products/admin', {
    method: 'POST',
    auth: true,
    body: buildProductRequestBody(product),
  });

  return normalizeProduct(response);
};

export const updateProduct = async (
  id: string,
  product: ProductInput,
): Promise<Product> => {
  const response = await apiRequest<ApiProduct>(`/products/admin/${id}`, {
    method: 'PUT',
    auth: true,
    body: buildProductRequestBody(product),
  });

  return normalizeProduct(response);
};

export const importProducts = async (
  products: ProductInput[],
): Promise<ProductImportSummary> => {
  return apiRequest<ProductImportSummary>('/products/admin/import', {
    method: 'POST',
    auth: true,
    body: {
      products: products.map(serializeProduct),
    },
  });
};

export const deleteProduct = async (id: string) => {
  await apiRequest(`/products/admin/${id}`, {
    method: 'DELETE',
    auth: true,
  });
};

export const fetchMyOrders = async (): Promise<Order[]> => {
  const response = await apiRequest<ApiOrder[]>('/orders/mine', { auth: true });
  return response.map(normalizeOrder);
};

export const fetchAllOrders = async (): Promise<Order[]> => {
  const response = await apiRequest<{ orders?: ApiOrder[] }>('/orders/admin', { auth: true });
  return (response.orders ?? []).map(normalizeOrder);
};

export const createOrder = async (
  items: CartItem[],
  shippingAddress: Address,
  prescriptionId?: string,
): Promise<Order> => {
  const response = await apiRequest<ApiOrder>('/orders', {
    method: 'POST',
    auth: true,
    body: {
      products: items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
      shippingAddress: serializeShippingAddress(shippingAddress),
      prescriptionId: prescriptionId || undefined,
    },
  });

  return normalizeOrder(response);
};

export const updateOrderStatus = async (
  id: string,
  orderStatus: OrderStatus,
): Promise<Order> => {
  const response = await apiRequest<ApiOrder>(`/orders/admin/${id}`, {
    method: 'PUT',
    auth: true,
    body: { orderStatus },
  });

  return normalizeOrder(response);
};

export const createPaymentOrder = async (orderId: string): Promise<PaymentOrderResult> => {
  const response = await apiRequest<{
    message?: string;
    order?: ApiOrder;
    orderId?: string;
    amount?: number;
    currency?: string;
    key?: string;
  }>('/payment/create-order', {
    method: 'POST',
    auth: true,
    body: { orderId },
  });

  return {
    message: response.message,
    order: response.order ? normalizeOrder(response.order) : undefined,
    orderId: response.orderId,
    amount: response.amount,
    currency: response.currency,
    key: response.key,
  };
};

export const verifyPayment = async (input: VerifyPaymentInput): Promise<Order> => {
  const response = await apiRequest<{ order?: ApiOrder } | ApiOrder>('/payment/verify', {
    method: 'POST',
    auth: true,
    body: input,
  });

  const order = 'order' in response ? response.order : response;
  if (!order) {
    throw new ApiError('Payment verification returned no order details.', 500, response);
  }

  return normalizeOrder(order as ApiOrder);
};

export const fetchMyPrescriptions = async (): Promise<Prescription[]> => {
  const response = await apiRequest<ApiPrescription[]>('/prescriptions/mine', { auth: true });
  return response.map(normalizePrescription);
};

export const fetchAllPrescriptions = async (): Promise<Prescription[]> => {
  const response = await apiRequest<{ prescriptions?: ApiPrescription[] }>('/prescriptions/admin', {
    auth: true,
  });
  return (response.prescriptions ?? []).map(normalizePrescription);
};

export const uploadPrescription = async (file: File): Promise<Prescription> => {
  const formData = new FormData();
  formData.append('prescription', file);

  const response = await apiRequest<ApiPrescription>('/prescriptions/upload', {
    method: 'POST',
    auth: true,
    body: formData,
  });

  return normalizePrescription(response);
};

export const reviewPrescription = async (
  id: string,
  input: ReviewPrescriptionInput,
): Promise<Prescription> => {
  const response = await apiRequest<ApiPrescription>(`/prescriptions/admin/${id}`, {
    method: 'PUT',
    auth: true,
    body: {
      status: input.status,
      reviewNote: input.notes ?? '',
    },
  });

  return normalizePrescription(response);
};

export type ContactFormInput = {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
};

export const submitContactForm = async (
  data: ContactFormInput,
): Promise<{ message: string; id: string }> => {
  return apiRequest<{ message: string; id: string }>('/leads', {
    method: 'POST',
    body: data as Record<string, unknown>,
  });
};
