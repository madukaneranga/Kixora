import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useCartStore } from './stores/cartStore';
import { useWishlistStore } from './stores/wishlistStore';
import { usePageTitle } from './hooks/usePageTitle';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import CartDrawer from './components/cart/CartDrawer';
import ScrollToTop from './components/ui/ScrollToTop';
import ScrollToTopOnRoute from './components/ui/ScrollToTopOnRoute';
import HomePage from './pages/HomePage';
import CollectionsPage from './pages/CollectionsPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CollectionDetailPage from './pages/CollectionDetailPage';
import CheckoutPage from './pages/CheckoutPage';
import WishlistPage from './pages/WishlistPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelPage from './pages/PaymentCancelPage';
import ThankYouPage from './pages/ThankYouPage';
import OrderDashboard from './pages/OrderDashboard';
import OrderDetails from './pages/OrderDetails';
import ProfilePage from './pages/ProfilePage';
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import OrdersManagement from './pages/admin/OrdersManagement';
import ProductsManagement from './pages/admin/ProductsManagement';
import CategoriesManagement from './pages/admin/CategoriesManagement';
import CollectionsManagement from './pages/admin/CollectionsManagement';
import UsersManagement from './pages/admin/UsersManagement';
import AuditLogs from './pages/admin/AuditLogs';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { PageLoading } from './components/ui/Loading';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AppLayout = () => {
  const location = useLocation();
  const isCheckoutPage = location.pathname === '/checkout';
  const isThankYouPage = location.pathname === '/thank-you';
  const isAdminPage = location.pathname.startsWith('/admin');
  const isSpecialPage = isCheckoutPage || isThankYouPage || isAdminPage;

  // Use the page title hook to dynamically update document title
  usePageTitle();

  return (
    <div className={`min-h-screen flex flex-col ${isSpecialPage ? 'bg-black' : 'bg-slate-50'}`}>
      {!isSpecialPage && <Header />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/collections/:slug" element={<CollectionDetailPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/orders" element={<OrderDashboard />} />
          <Route path="/orders/:orderId" element={<OrderDetails />} />
          <Route path="/thank-you" element={<ThankYouPage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/cancel" element={<PaymentCancelPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
          <Route path="/admin/orders" element={<ProtectedAdminRoute><OrdersManagement /></ProtectedAdminRoute>} />
          <Route path="/admin/products" element={<ProtectedAdminRoute><ProductsManagement /></ProtectedAdminRoute>} />
          <Route path="/admin/categories" element={<ProtectedAdminRoute><CategoriesManagement /></ProtectedAdminRoute>} />
          <Route path="/admin/collections" element={<ProtectedAdminRoute><CollectionsManagement /></ProtectedAdminRoute>} />
          <Route path="/admin/users" element={<ProtectedAdminRoute><UsersManagement /></ProtectedAdminRoute>} />
          <Route path="/admin/audit" element={<ProtectedAdminRoute><AuditLogs /></ProtectedAdminRoute>} />
          {/* Add more routes as needed */}
        </Routes>
      </main>
      {!isSpecialPage && <Footer />}
      <CartDrawer />
      <ScrollToTop />
    </div>
  );
};

const AppContent = () => {
  const { user, loading: authLoading, isNewUser } = useAuth();
  const { setUserId } = useCartStore();
  const { mergeWithDbWishlist, clearLocal } = useWishlistStore();

  useEffect(() => {
    // Update cart store with current user ID and new user flag
    setUserId(user?.id || null, isNewUser);

    if (user && !authLoading) {
      mergeWithDbWishlist(user.id);
    } else if (!user && !authLoading) {
      // Clear wishlist when user signs out
      clearLocal();
    }
  }, [user?.id, authLoading, isNewUser, mergeWithDbWishlist, setUserId, clearLocal]);

  if (authLoading) {
    return <PageLoading />;
  }

  return (
    <Router>
      <ScrollToTopOnRoute />
      <AppLayout />
    </Router>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3000,
          // Remove default styles since we're using custom toasts
          style: {
            background: 'transparent',
            boxShadow: 'none',
            padding: 0,
            border: 'none',
          },
        }}
        containerStyle={{
          bottom: '20px',
        }}
      />
    </QueryClientProvider>
  );
}

export default App;