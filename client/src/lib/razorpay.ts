import { logger } from '../utils/logger';

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  handler: (response: RazorpayPaymentResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
  onPaymentFailed?: (response: RazorpayFailureEvent) => void;
}

export interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayFailureEvent {
  error?: {
    description?: string;
    reason?: string;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: 'payment.failed', handler: (response: RazorpayFailureEvent) => void) => void;
}

const RAZORPAY_CHECKOUT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

let razorpayScriptPromise: Promise<void> | null = null;

export const loadRazorpayCheckout = async () => {
  if (typeof window === 'undefined') {
    throw new Error('Razorpay checkout is only available in the browser.');
  }

  if (window.Razorpay) {
    return;
  }

  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise<void>((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        `script[src="${RAZORPAY_CHECKOUT_URL}"]`,
      );

      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener(
          'error',
          () => reject(new Error('Failed to load Razorpay checkout script.')),
          { once: true },
        );
        return;
      }

      const script = document.createElement('script');
      script.src = RAZORPAY_CHECKOUT_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay checkout script.'));
      document.body.appendChild(script);
    });
  }

  await razorpayScriptPromise;

  if (!window.Razorpay) {
    throw new Error('Razorpay checkout is unavailable after loading the script.');
  }
};

export const openRazorpayCheckout = async (options: Omit<RazorpayCheckoutOptions, 'handler'>) => {
  await loadRazorpayCheckout();

  return new Promise<RazorpayPaymentResponse>((resolve, reject) => {
    if (!window.Razorpay) {
      reject(new Error('Razorpay checkout is unavailable.'));
      return;
    }

    const razorpay = new window.Razorpay({
      ...options,
      handler: (response) => resolve(response),
      modal: {
        ondismiss: () => reject(new Error('Payment was cancelled before completion.')),
      },
    });

    razorpay.on('payment.failed', () => {
      logger.error('Razorpay payment attempt failed');
    });

    razorpay.open();
  });
};
