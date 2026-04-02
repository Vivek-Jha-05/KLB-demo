import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  CreditCard,
  FileText,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
} from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useOrderStore } from '../store/orderStore';
import { usePrescriptionStore } from '../store/prescriptionStore';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { openRazorpayCheckout } from '../lib/razorpay';

type CheckoutStep = 'cart' | 'address' | 'payment' | 'confirmation';

export const CartPage: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const {
    fetchCart,
    getItems,
    removeFromCart,
    updateQuantity,
    getTotal,
    clearCart,
    hasPrescriptionItems,
    setShippingAddress,
    getShippingAddress,
  } = useCartStore();
  const {
    createOrder,
    createPaymentForOrder,
    verifyPaymentForOrder,
    isLoading: isOrderLoading,
  } = useOrderStore();
  const {
    fetchMyPrescriptions,
    getApprovedPrescriptions,
    isLoading: isPrescriptionLoading,
  } = usePrescriptionStore();

  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('cart');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState('');
  const [placedOrderId, setPlacedOrderId] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');

  const items = user ? getItems(user.id) : [];
  const total = user ? getTotal(user.id) : 0;
  const hasRxItems = user ? hasPrescriptionItems(user.id) : false;
  const shippingAddress = user ? getShippingAddress(user.id) : null;
  const approvedPrescriptions = user ? getApprovedPrescriptions(user.id) : [];
  const deliveryFee = total >= 500 ? 0 : 50;
  const payableAmount = total + deliveryFee;

  const [addressForm, setAddressForm] = useState({
    fullName: shippingAddress?.fullName || user?.name || '',
    street: shippingAddress?.street || '',
    city: shippingAddress?.city || '',
    state: shippingAddress?.state || '',
    pincode: shippingAddress?.pincode || '',
    phone: shippingAddress?.phone || '',
  });

  useEffect(() => {
    if (isAuthenticated) {
      void fetchCart(user?.id);
      void fetchMyPrescriptions();
    }
  }, [fetchCart, fetchMyPrescriptions, isAuthenticated, user?.id]);

  useEffect(() => {
    if (!selectedPrescriptionId && approvedPrescriptions.length > 0) {
      setSelectedPrescriptionId(approvedPrescriptions[0].id);
    }
  }, [approvedPrescriptions, selectedPrescriptionId]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Please sign in to view your cart</h2>
        <p className="text-gray-600 mb-6">You need to be logged in to add items to your cart</p>
        <Link to="/">
          <Button>Go to Home</Button>
        </Link>
      </div>
    );
  }

  if (items.length === 0 && !orderPlaced) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-600 mb-6">Looks like you haven't added any products yet</p>
        <Link to="/products">
          <Button>
            Continue Shopping
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    );
  }

  const completeCheckout = (orderId: string, message?: string) => {
    if (!user) {
      return;
    }

    setPlacedOrderId(orderId);
    setPaymentMessage(message ?? '');
    setOrderPlaced(true);
    setCheckoutStep('confirmation');
    void clearCart(user.id).catch(() => undefined);
  };

  const handleCartAction = (action: Promise<void>) => {
    setCheckoutError('');
    void action.catch((error) => {
      setCheckoutError(
        error instanceof Error ? error.message : 'Unable to update your cart right now.',
      );
    });
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      return;
    }

    try {
      await setShippingAddress(user.id, addressForm);
      setCheckoutError('');
      setPaymentMessage('');
      setCheckoutStep('payment');
    } catch (error) {
      setCheckoutError(
        error instanceof Error ? error.message : 'Unable to save your delivery address.',
      );
    }
  };

  const handlePayment = async () => {
    if (!user || !shippingAddress) {
      return;
    }

    if (hasRxItems && !selectedPrescriptionId) {
      setCheckoutError('Please select an approved prescription before paying.');
      return;
    }

    setCheckoutError('');
    setPaymentMessage('');
    setIsProcessingPayment(true);

    try {
      if (paymentMethod === 'cod') {
        const order = await createOrder(
          items,
          shippingAddress,
          hasRxItems ? selectedPrescriptionId : undefined,
          'cod'
        );
        completeCheckout(order.id, 'Order placed successfully with Cash on Delivery.');
        return;
      }

      // Online Payment Flow
      const order = await createOrder(
        items,
        shippingAddress,
        hasRxItems ? selectedPrescriptionId : undefined,
        'online'
      );

      const paymentResult = await createPaymentForOrder(order.id);

      if (!paymentResult.orderId || !paymentResult.key || !paymentResult.amount || !paymentResult.currency) {
        throw new Error(paymentResult.message || 'Unable to initiate payment.');
      }

      const paymentResponse = await openRazorpayCheckout({
        key: paymentResult.key,
        amount: paymentResult.amount,
        currency: paymentResult.currency,
        order_id: paymentResult.orderId,
        name: 'KLB Lifesciences Pvt. Ltd.',
        description: `Order #${order.id.slice(-8).toUpperCase()}`,
        prefill: {
          name: shippingAddress.fullName || user.name,
          email: user.email,
          contact: shippingAddress.phone,
        },
        notes: {
          internalOrderId: order.id,
          customerName: shippingAddress.fullName || user.name,
        },
        theme: {
          color: '#059669',
        },
        onPaymentFailed: (response) => {
          setCheckoutError(response.error?.description || 'Payment attempt failed. You can try again.');
        },
      });

      const verifiedOrder = await verifyPaymentForOrder(paymentResponse);
      completeCheckout(verifiedOrder.id, 'Payment completed successfully via Razorpay.');
    } catch (error) {
      // Only set error if it wasn't a cancellation (handled by ondismiss in lib/razorpay.ts)
      if (error instanceof Error && error.message.includes('cancelled')) {
        setIsProcessingPayment(false);
        return;
      }
      setCheckoutError(
        error instanceof Error ? error.message : 'Unable to place your order right now.',
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {['cart', 'address', 'payment', 'confirmation'].map((step, index) => (
        <React.Fragment key={step}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              checkoutStep === step
                ? 'bg-emerald-600 text-white'
                : index < ['cart', 'address', 'payment', 'confirmation'].indexOf(checkoutStep)
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-gray-200 text-gray-500'
            }`}
          >
            {index + 1}
          </div>
          {index < 3 && (
            <div
              className={`w-16 h-1 ${
                index < ['cart', 'address', 'payment', 'confirmation'].indexOf(checkoutStep)
                  ? 'bg-emerald-600'
                  : 'bg-gray-200'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderCartItems = () => (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.product.id}>
          <CardContent className="p-4 flex items-center gap-4">
            <img
              src={item.product.image}
              alt={item.product.name}
              className="w-20 h-20 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
              <p className="text-sm text-gray-500">{item.product.category}</p>
              {item.product.requiresPrescription && (
                <span className="inline-flex items-center text-xs text-orange-600 mt-1">
                  <FileText className="w-3 h-3 mr-1" />
                  Prescription Required
                </span>
              )}
              <p className="text-emerald-600 font-semibold mt-1">INR {item.product.price}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  user &&
                  handleCartAction(updateQuantity(user.id, item.product.id, item.quantity - 1))
                }
                disabled={item.quantity <= 1}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center">{item.quantity}</span>
              <button
                onClick={() =>
                  user &&
                  handleCartAction(updateQuantity(user.id, item.product.id, item.quantity + 1))
                }
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="text-right">
              <p className="font-semibold">INR {item.product.price * item.quantity}</p>
              <button
                onClick={() =>
                  user && handleCartAction(removeFromCart(user.id, item.product.id))
                }
                className="text-red-500 hover:text-red-600 mt-2"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderAddressForm = () => (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-emerald-600" />
          Delivery Address
        </h3>
        <form onSubmit={handleAddressSubmit} className="space-y-4">
          <Input
            label="Full Name"
            value={addressForm.fullName}
            onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
            required
          />
          <Input
            label="Street Address"
            value={addressForm.street}
            onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              value={addressForm.city}
              onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
              required
            />
            <Input
              label="State"
              value={addressForm.state}
              onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="PIN Code"
              value={addressForm.pincode}
              onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
              required
            />
            <Input
              label="Phone Number"
              type="tel"
              value={addressForm.phone}
              onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
              required
            />
          </div>
          <div className="flex gap-4 pt-4">
            <Button variant="outline" type="button" onClick={() => setCheckoutStep('cart')}>
              Back to Cart
            </Button>
            <Button type="submit" className="flex-1">
              Continue to Payment
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const renderPayment = () => (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <CreditCard className="w-5 h-5 mr-2 text-emerald-600" />
          Payment Details
        </h3>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Delivery Address</p>
            <p className="font-medium">{shippingAddress?.fullName}</p>
            <p className="font-medium">{shippingAddress?.street}</p>
            <p className="text-sm">
              {shippingAddress?.city}, {shippingAddress?.state} {shippingAddress?.pincode}
            </p>
            <p className="text-sm">Phone: {shippingAddress?.phone}</p>
          </div>

          {hasRxItems && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-orange-800">Prescription Items in Cart</p>
                <p className="text-sm text-orange-700">
                  Your order contains prescription medicines. Please attach one of your approved
                  prescriptions before payment.
                </p>
              </div>
            </div>
          )}

          {hasRxItems && (
            <div className="border rounded-lg p-4">
              <p className="font-medium text-gray-900 mb-3">Select Approved Prescription</p>
              {isPrescriptionLoading && approvedPrescriptions.length === 0 ? (
                <p className="text-sm text-gray-500">Loading your approved prescriptions...</p>
              ) : approvedPrescriptions.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    You do not have an approved prescription yet for this order.
                  </p>
                  <Link to="/upload-prescription">
                    <Button variant="outline" size="sm">
                      Upload Prescription
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {approvedPrescriptions.map((prescription) => (
                    <label
                      key={prescription.id}
                      className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:border-emerald-300"
                    >
                      <input
                        type="radio"
                        name="approvedPrescription"
                        checked={selectedPrescriptionId === prescription.id}
                        onChange={() => setSelectedPrescriptionId(prescription.id)}
                        className="text-emerald-600"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{prescription.fileName}</p>
                        <p className="text-sm text-gray-500">
                          Approved on{' '}
                          {prescription.reviewedAt
                            ? new Date(prescription.reviewedAt).toLocaleDateString('en-IN')
                            : new Date(prescription.createdAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium mb-3">Select Payment Method</p>
            <div className="space-y-3">
              <label className="flex items-center gap-3 bg-white p-3 rounded-md border cursor-pointer hover:border-emerald-500 transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="online"
                  checked={paymentMethod === 'online'}
                  onChange={() => setPaymentMethod('online')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium text-gray-900">Online Payment (Razorpay)</span>
                </div>
              </label>

              <label className="flex items-center gap-3 bg-white p-3 rounded-md border cursor-pointer hover:border-emerald-500 transition-colors">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium text-gray-900">Cash on Delivery (COD)</span>
                </div>
              </label>
            </div>
            {paymentMethod === 'online' && (
              <p className="text-xs text-blue-600 mt-3">
                <strong>Razorpay Checkout:</strong> Online payments are initiated only through the
                server-configured Razorpay account.
              </p>
            )}
          </div>

          {checkoutError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
              {checkoutError}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button variant="outline" onClick={() => setCheckoutStep('address')}>
              Back
            </Button>
            <Button
              onClick={() => void handlePayment()}
              className="flex-1"
              isLoading={isProcessingPayment || isOrderLoading}
              disabled={hasRxItems && approvedPrescriptions.length === 0}
            >
              {paymentMethod === 'online' ? (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay INR {payableAmount}
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Place COD Order
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderConfirmation = () => (
    <Card>
      <CardContent className="p-8 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h2>
        <p className="text-gray-600 mb-6">
          Thank you for your order. You will receive a confirmation email shortly.
        </p>
        {paymentMessage && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-emerald-700">{paymentMessage}</p>
          </div>
        )}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-gray-600">Order ID</p>
          <p className="font-mono font-semibold">{placedOrderId || 'Pending confirmation'}</p>
        </div>
        {hasRxItems && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <Truck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800 text-left">
              Your prescription order is being reviewed by our pharmacist. You'll be notified once
              it's approved and shipped.
            </p>
          </div>
        )}
        <div className="flex gap-4 justify-center">
          <Link to="/dashboard?order=success">
            <Button variant="outline">View Orders</Button>
          </Link>
          <Link to="/products">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        {checkoutStep === 'cart' && 'Shopping Cart'}
        {checkoutStep === 'address' && 'Delivery Address'}
        {checkoutStep === 'payment' && 'Payment'}
        {checkoutStep === 'confirmation' && 'Order Confirmed'}
      </h1>

      {renderStepIndicator()}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {checkoutStep === 'cart' && renderCartItems()}
          {checkoutStep === 'address' && renderAddressForm()}
          {checkoutStep === 'payment' && renderPayment()}
          {checkoutStep === 'confirmation' && renderConfirmation()}
        </div>

        {checkoutStep !== 'confirmation' && (
          <div>
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal ({items.length} items)</span>
                    <span>INR {total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery</span>
                    <span>{deliveryFee === 0 ? 'Free' : `INR ${deliveryFee}`}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span className="text-emerald-600">INR {payableAmount}</span>
                    </div>
                  </div>
                </div>

                {checkoutStep === 'cart' && (
                  <Button onClick={() => setCheckoutStep('address')} className="w-full mt-6">
                    Proceed to Checkout
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}

                <div className="mt-4 text-xs text-gray-500 text-center">
                  Secure checkout powered by Razorpay
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
