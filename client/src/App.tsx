import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { AdminLayout } from './components/layout/AdminLayout';
import { LandingPage } from './pages/LandingPage';
import { ProductListingPage } from './pages/ProductListingPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { PrescriptionUploadPage } from './pages/PrescriptionUploadPage';
import { UserDashboardPage } from './pages/UserDashboardPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminPrescriptionsPage } from './pages/admin/AdminPrescriptionsPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminLeadsPage } from './pages/admin/AdminLeadsPage';
import { useAuthStore } from './store/authStore';

function App() {
  useEffect(() => {
    void useAuthStore.getState().initialize();
  }, []);

  return (
    <Router>
      <Routes>
        {/* Customer-facing routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="products" element={<ProductListingPage />} />
          <Route path="product/:id" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="upload-prescription" element={<PrescriptionUploadPage />} />
          <Route path="dashboard" element={<UserDashboardPage />} />
        </Route>

        {/* Admin routes - separate layout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="prescriptions" element={<AdminPrescriptionsPage />} />
          <Route path="leads" element={<AdminLeadsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
