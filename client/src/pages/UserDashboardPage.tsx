import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, Navigate } from 'react-router-dom';
import {
  Package,
  FileText,
  User,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useAuthStore } from '../store/authStore';
import { useOrderStore } from '../store/orderStore';
import { usePrescriptionStore } from '../store/prescriptionStore';

export const UserDashboardPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'orders' | 'prescriptions' | 'profile'>('orders');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const { user, isAuthenticated, isInitialized } = useAuthStore();
  const { fetchUserOrders, getUserOrders, isLoading: isOrdersLoading } = useOrderStore();
  const {
    fetchMyPrescriptions,
    getUserPrescriptions,
    isLoading: isPrescriptionsLoading,
  } = usePrescriptionStore();

  useEffect(() => {
    if (searchParams.get('order') === 'success') {
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated) {
      void fetchUserOrders();
      void fetchMyPrescriptions();
    }
  }, [fetchMyPrescriptions, fetchUserOrders, isAuthenticated]);

  if (!isInitialized) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Loading your dashboard...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const orders = getUserOrders(user.id);
  const prescriptions = getUserPrescriptions(user.id);

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Delivered</Badge>;
      case 'shipped':
        return <Badge variant="info"><Truck className="w-3 h-3 mr-1" />Shipped</Badge>;
      case 'processing':
        return <Badge variant="info"><Clock className="w-3 h-3 mr-1" />Processing</Badge>;
      case 'pending_approval':
        return <Badge variant="warning"><AlertCircle className="w-3 h-3 mr-1" />Pending Approval</Badge>;
      case 'approved':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'cancelled':
        return <Badge variant="danger"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPrescriptionStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="danger"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {showSuccessMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <h4 className="font-medium text-green-800">Order Placed Successfully!</h4>
              <p className="text-sm text-green-700">
                Thank you for your order. You can track your order status here.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user.name}!</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="text-center py-4">
            <Package className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            <p className="text-sm text-gray-600">Total Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-4">
            <Truck className="w-8 h-8 mx-auto text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {orders.filter(o => o.orderStatus === 'shipped').length}
            </p>
            <p className="text-sm text-gray-600">In Transit</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-4">
            <CheckCircle className="w-8 h-8 mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {orders.filter(o => o.orderStatus === 'delivered').length}
            </p>
            <p className="text-sm text-gray-600">Delivered</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-4">
            <FileText className="w-8 h-8 mx-auto text-amber-600 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{prescriptions.length}</p>
            <p className="text-sm text-gray-600">Prescriptions</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Package className="w-4 h-4" />
            Orders
          </button>
          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`pb-3 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'prescriptions'
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            Prescriptions
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="w-4 h-4" />
            Profile
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {isOrdersLoading && orders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500">Loading your orders...</p>
              </CardContent>
            </Card>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Yet</h3>
                <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
                <Link to="/products">
                  <Button>Browse Products</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => (
              <Card key={order.id} hover>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-gray-900">
                          Order #{order.id.slice(-8).toUpperCase()}
                        </span>
                        {getOrderStatusBadge(order.orderStatus)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {order.items.slice(0, 2).map((item, idx) => (
                          <span key={idx} className="text-sm text-gray-500">
                            {item.productName} x{item.quantity}
                            {idx < Math.min(order.items.length - 1, 1) && ', '}
                          </span>
                        ))}
                        {order.items.length > 2 && (
                          <span className="text-sm text-gray-500">
                            +{order.items.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">₹{order.totalAmount}</p>
                        <p className="text-sm text-gray-500">
                          {order.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending'}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>

                  {order.orderStatus === 'pending_approval' && (
                    <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-sm text-amber-700">
                        <AlertCircle className="w-4 h-4 inline mr-1" />
                        This order contains prescription medicines and is awaiting approval.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Your Prescriptions</h2>
            <Link to="/upload-prescription">
              <Button size="sm">Upload New</Button>
            </Link>
          </div>
          {isPrescriptionsLoading && prescriptions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500">Loading your prescriptions...</p>
              </CardContent>
            </Card>
          ) : prescriptions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Prescriptions</h3>
                <p className="text-gray-600 mb-6">Upload your prescriptions to order medicines</p>
                <Link to="/upload-prescription">
                  <Button>Upload Prescription</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            prescriptions.map((prescription) => (
              <Card key={prescription.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{prescription.fileName}</p>
                        <p className="text-sm text-gray-500">
                          Uploaded on {new Date(prescription.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getPrescriptionStatusBadge(prescription.status)}
                      {prescription.reviewedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Reviewed: {new Date(prescription.reviewedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  {prescription.notes && (
                    <div className="mt-3 bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600">{prescription.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Profile Information</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-emerald-600">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{user.name}</p>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>
            <div className="border-t pt-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Member Since</label>
                  <p className="font-medium text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString('en-IN', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Account Type</label>
                  <p className="font-medium text-gray-900 capitalize">{user.role}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
