import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  FileText,
  IndianRupee,
  Package,
  ShoppingBag,
  Users,
  XCircle,
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { useProductStore } from '../../store/productStore';
import { useOrderStore } from '../../store/orderStore';
import { usePrescriptionStore } from '../../store/prescriptionStore';
import { formatCurrency } from '../../utils/formatters';

const DASHBOARD_REFRESH_INTERVAL_MS = 30_000;

export const AdminDashboardPage: React.FC = () => {
  const { fetchProducts, products } = useProductStore();
  const { fetchAllOrders, orders } = useOrderStore();
  const { fetchAllPrescriptions, prescriptions } = usePrescriptionStore();

  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  useEffect(() => {
    let isMounted = true;

    const refreshDashboard = async () => {
      await Promise.all([fetchProducts(), fetchAllOrders(), fetchAllPrescriptions()]);
      if (isMounted) {
        setLastRefreshedAt(new Date());
      }
    };

    void refreshDashboard();
    const intervalId = window.setInterval(() => {
      void refreshDashboard();
    }, DASHBOARD_REFRESH_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [fetchAllOrders, fetchAllPrescriptions, fetchProducts]);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const totalRevenue = orders
    .filter((order) => order.paymentStatus === 'paid')
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const todayRevenue = orders
    .filter(
      (order) =>
        order.paymentStatus === 'paid' && new Date(order.updatedAt).getTime() >= startOfToday.getTime(),
    )
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const ordersPlacedToday = orders.filter(
    (order) => new Date(order.createdAt).getTime() >= startOfToday.getTime(),
  ).length;

  const pendingOrders = orders.filter((order) => order.orderStatus === 'pending_approval').length;
  const processingOrders = orders.filter((order) => order.orderStatus === 'processing').length;
  const shippedOrders = orders.filter((order) => order.orderStatus === 'shipped').length;
  const deliveredOrders = orders.filter((order) => order.orderStatus === 'delivered').length;

  const pendingPrescriptions = prescriptions.filter(
    (prescription) => prescription.status === 'pending',
  ).length;
  const approvedPrescriptions = prescriptions.filter(
    (prescription) => prescription.status === 'approved',
  ).length;
  const lowStockProducts = products.filter((product) => product.stock > 0 && product.stock <= 10);
  const outOfStockProducts = products.filter((product) => product.stock === 0);

  const stats = [
    {
      title: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      note: `Today ${formatCurrency(todayRevenue)}`,
      icon: <IndianRupee className="h-6 w-6" />,
      color: 'emerald',
    },
    {
      title: 'Total Orders',
      value: orders.length.toString(),
      note: `${ordersPlacedToday} placed today`,
      icon: <ShoppingBag className="h-6 w-6" />,
      color: 'blue',
    },
    {
      title: 'Total Products',
      value: products.length.toString(),
      note: `${lowStockProducts.length} low stock`,
      icon: <Package className="h-6 w-6" />,
      color: 'purple',
    },
    {
      title: 'Pending Rx',
      value: pendingPrescriptions.toString(),
      note: `${approvedPrescriptions} approved`,
      icon: <FileText className="h-6 w-6" />,
      color: 'orange',
    },
  ] as const;

  const recentOrders = orders.slice(0, 5);
  const recentPrescriptions = prescriptions
    .filter((prescription) => prescription.status === 'pending')
    .slice(0, 5);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending_approval: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-blue-100 text-blue-700',
      processing: 'bg-purple-100 text-purple-700',
      shipped: 'bg-indigo-100 text-indigo-700',
      delivered: 'bg-emerald-100 text-emerald-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600">
            Live store metrics refresh automatically every 30 seconds.
          </p>
        </div>
        <p className="text-sm text-gray-500">
          {lastRefreshedAt
            ? `Last updated ${lastRefreshedAt.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}`
            : 'Refreshing dashboard...'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    stat.color === 'emerald'
                      ? 'bg-emerald-100 text-emerald-600'
                      : stat.color === 'blue'
                        ? 'bg-blue-100 text-blue-600'
                        : stat.color === 'purple'
                          ? 'bg-purple-100 text-purple-600'
                          : 'bg-orange-100 text-orange-600'
                  }`}
                >
                  {stat.icon}
                </div>
                <span className="text-sm text-gray-500">{stat.note}</span>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-5">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Order Status Overview</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-xl bg-yellow-50 p-4 text-center">
              <Clock className="mx-auto mb-2 h-8 w-8 text-yellow-600" />
              <p className="text-2xl font-bold text-yellow-700">{pendingOrders}</p>
              <p className="text-sm text-yellow-600">Pending Approval</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-4 text-center">
              <Package className="mx-auto mb-2 h-8 w-8 text-blue-600" />
              <p className="text-2xl font-bold text-blue-700">{processingOrders}</p>
              <p className="text-sm text-blue-600">Processing</p>
            </div>
            <div className="rounded-xl bg-purple-50 p-4 text-center">
              <ShoppingBag className="mx-auto mb-2 h-8 w-8 text-purple-600" />
              <p className="text-2xl font-bold text-purple-700">{shippedOrders}</p>
              <p className="text-sm text-purple-600">Shipped</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4 text-center">
              <CheckCircle className="mx-auto mb-2 h-8 w-8 text-emerald-600" />
              <p className="text-2xl font-bold text-emerald-700">{deliveredOrders}</p>
              <p className="text-sm text-emerald-600">Delivered</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
              <Link
                to="/admin/orders"
                className="flex items-center text-sm text-emerald-600 hover:underline"
              >
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            {recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        #{order.id.slice(-6).toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-500">{order.userName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(order.totalAmount)}</p>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${getStatusBadge(order.orderStatus)}`}
                      >
                        {order.orderStatus.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-gray-500">No orders yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Pending Prescriptions</h3>
              <Link
                to="/admin/prescriptions"
                className="flex items-center text-sm text-emerald-600 hover:underline"
              >
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            {recentPrescriptions.length > 0 ? (
              <div className="space-y-3">
                {recentPrescriptions.map((prescription) => (
                  <div
                    key={prescription.id}
                    className="flex items-center justify-between rounded-lg bg-orange-50 p-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{prescription.userName}</p>
                      <p className="text-sm text-gray-500">{prescription.fileName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {formatDate(prescription.createdAt)}
                      </p>
                      <span className="rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-700">
                        Awaiting Review
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-gray-500">No pending prescriptions</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Inventory Alerts</h3>
            <Link
              to="/admin/products"
              className="flex items-center text-sm text-emerald-600 hover:underline"
            >
              Manage Products <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-red-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <h4 className="font-medium text-red-800">
                  Out of Stock ({outOfStockProducts.length})
                </h4>
              </div>
              {outOfStockProducts.length > 0 ? (
                <div className="space-y-2">
                  {outOfStockProducts.slice(0, 3).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-red-700">{product.name}</span>
                      <span className="font-medium text-red-600">0 units</span>
                    </div>
                  ))}
                  {outOfStockProducts.length > 3 && (
                    <p className="text-sm text-red-600">
                      +{outOfStockProducts.length - 3} more
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-red-600">All products in stock.</p>
              )}
            </div>

            <div className="rounded-lg bg-yellow-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <h4 className="font-medium text-yellow-800">
                  Low Stock ({lowStockProducts.length})
                </h4>
              </div>
              {lowStockProducts.length > 0 ? (
                <div className="space-y-2">
                  {lowStockProducts.slice(0, 3).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-yellow-700">{product.name}</span>
                      <span className="font-medium text-yellow-600">{product.stock} units</span>
                    </div>
                  ))}
                  {lowStockProducts.length > 3 && (
                    <p className="text-sm text-yellow-600">
                      +{lowStockProducts.length - 3} more
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-yellow-600">No low stock items.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Link to="/admin/products" className="block">
              <div className="rounded-lg border p-4 text-center transition-colors hover:bg-gray-50">
                <Package className="mx-auto mb-2 h-8 w-8 text-emerald-600" />
                <p className="font-medium text-gray-900">Add Product</p>
              </div>
            </Link>
            <Link to="/admin/orders" className="block">
              <div className="rounded-lg border p-4 text-center transition-colors hover:bg-gray-50">
                <ShoppingBag className="mx-auto mb-2 h-8 w-8 text-blue-600" />
                <p className="font-medium text-gray-900">Manage Orders</p>
              </div>
            </Link>
            <Link to="/admin/prescriptions" className="block">
              <div className="rounded-lg border p-4 text-center transition-colors hover:bg-gray-50">
                <FileText className="mx-auto mb-2 h-8 w-8 text-orange-600" />
                <p className="font-medium text-gray-900">Review Rx</p>
              </div>
            </Link>
            <Link to="/" className="block">
              <div className="rounded-lg border p-4 text-center transition-colors hover:bg-gray-50">
                <Users className="mx-auto mb-2 h-8 w-8 text-purple-600" />
                <p className="font-medium text-gray-900">View Store</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
