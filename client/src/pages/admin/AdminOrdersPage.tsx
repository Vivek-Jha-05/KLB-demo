import React, { useEffect, useState } from 'react';
import {
  Search,
  Eye,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  FileText,
  MapPin,
  Phone
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useOrderStore } from '../../store/orderStore';
import { Order } from '../../types';
import { formatCurrency } from '../../utils/formatters';

export const AdminOrdersPage: React.FC = () => {
  const { fetchAllOrders, orders, updateOrderStatus } = useOrderStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState<string | null>(null);

  useEffect(() => {
    void fetchAllOrders();
  }, [fetchAllOrders]);

  const statuses = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending_approval', label: 'Pending Approval' },
    { value: 'approved', label: 'Approved' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.userName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.orderStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_approval': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'processing': return <Package className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusStyle = (status: string) => {
    const styles: Record<string, string> = {
      pending_approval: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-blue-100 text-blue-700',
      processing: 'bg-purple-100 text-purple-700',
      shipped: 'bg-indigo-100 text-indigo-700',
      delivered: 'bg-emerald-100 text-emerald-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus as Order['orderStatus']);
      setShowStatusDropdown(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to update order status');
    }
  };

  const getNextStatuses = (currentStatus: string): string[] => {
    const flow: Record<string, string[]> = {
      pending_approval: ['approved', 'cancelled'],
      approved: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: []
    };
    return flow[currentStatus] || [];
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600">View and manage all customer orders</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{filteredOrders.length} orders</span>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statuses.slice(1).map((status) => {
          const count = orders.filter(o => o.orderStatus === status.value).length;
          return (
            <button
              key={status.value}
              onClick={() => setStatusFilter(status.value)}
              className={`p-4 rounded-lg border transition-all ${
                statusFilter === status.value 
                  ? 'border-emerald-500 bg-emerald-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${getStatusStyle(status.value)}`}>
                {getStatusIcon(status.value)}
              </div>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-500">{status.label}</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order ID or customer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {statuses.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Order ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Customer</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Items</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Total</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-mono font-medium text-gray-900">
                      #{order.id.slice(-6).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{order.userName}</p>
                      <p className="text-sm text-gray-500">{order.shippingAddress.phone}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">{order.items.length} item(s)</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{formatCurrency(order.totalAmount)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">{formatDate(order.createdAt)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <button
                        onClick={() => setShowStatusDropdown(showStatusDropdown === order.id ? null : order.id)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(order.orderStatus)}`}
                      >
                        {getStatusIcon(order.orderStatus)}
                        <span className="capitalize">{order.orderStatus.replace('_', ' ')}</span>
                        {getNextStatuses(order.orderStatus).length > 0 && (
                          <ChevronDown className="w-3 h-3 ml-1" />
                        )}
                      </button>
                      
                      {showStatusDropdown === order.id && getNextStatuses(order.orderStatus).length > 0 && (
                        <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-lg shadow-lg border py-1 z-10">
                          {getNextStatuses(order.orderStatus).map((status) => (
                            <button
                              key={status}
                              onClick={() => void handleStatusChange(order.id, status)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                            >
                              {getStatusIcon(status)}
                              <span className="capitalize">{status.replace('_', ' ')}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No orders found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Order Detail Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title="Order Details"
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Order Header */}
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <p className="text-sm text-gray-500">Order ID</p>
                <p className="font-mono font-semibold text-lg">#{selectedOrder.id.slice(-6).toUpperCase()}</p>
              </div>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(selectedOrder.orderStatus)}`}>
                {getStatusIcon(selectedOrder.orderStatus)}
                <span className="capitalize">{selectedOrder.orderStatus.replace('_', ' ')}</span>
              </span>
            </div>

            {/* Customer Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Customer Information</h4>
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{selectedOrder.userName}</span>
                  </p>
                  <p className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    {selectedOrder.shippingAddress.phone}
                  </p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Delivery Address</h4>
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p>{selectedOrder.shippingAddress.fullName}</p>
                    <p>{selectedOrder.shippingAddress.street}</p>
                    <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.pincode}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Order Items</h4>
              <div className="bg-gray-50 rounded-lg divide-y">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3">
                    <div>
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">Total Amount</span>
                <span className="text-xl font-bold text-emerald-600">
                  {formatCurrency(selectedOrder.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2 text-sm">
                <span className="text-gray-500">Payment Status</span>
                <span className={`px-2 py-1 rounded ${
                  selectedOrder.paymentStatus === 'paid' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {selectedOrder.paymentStatus}
                </span>
              </div>
            </div>

            {/* Prescription Link */}
            {selectedOrder.prescriptionId && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center gap-3">
                <FileText className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-800">Prescription Order</p>
                  <p className="text-sm text-orange-600">This order requires prescription verification</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>
              {getNextStatuses(selectedOrder.orderStatus).length > 0 && (
                <div className="flex gap-2">
                  {getNextStatuses(selectedOrder.orderStatus).map((status) => (
                    <Button
                      key={status}
                      variant={status === 'cancelled' ? 'danger' : 'primary'}
                      onClick={() => {
                        void handleStatusChange(selectedOrder.id, status);
                        setSelectedOrder(null);
                      }}
                    >
                      {status === 'cancelled' ? 'Cancel Order' : `Mark as ${status.replace('_', ' ')}`}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
