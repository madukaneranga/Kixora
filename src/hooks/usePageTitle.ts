import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const getPageTitle = (pathname: string): string => {
  // Remove leading slash and split path segments
  const segments = pathname.split('/').filter(Boolean);

  // Handle root/home page
  if (segments.length === 0) {
    return 'Kixora';
  }

  // Handle specific routes
  switch (segments[0]) {
    case 'collections':
      if (segments.length === 1) {
        return 'Collections - Kixora';
      }
      // For specific collection pages, we'll use a generic title
      // In a real app, you might want to fetch the collection name
      return 'Collection - Kixora';

    case 'products':
      if (segments.length === 1) {
        return 'All Products - Kixora';
      }
      // For specific product pages
      return 'Product - Kixora';

    case 'wishlist':
      return 'Wishlist - Kixora';

    case 'checkout':
      return 'Checkout - Kixora';

    case 'profile':
      return 'Profile - Kixora';

    case 'orders':
      if (segments.length === 1) {
        return 'My Orders - Kixora';
      }
      return 'Order Details - Kixora';

    case 'thank-you':
      return 'Thank You - Kixora';

    case 'privacy-policy':
      return 'Privacy Policy - Kixora';

    case 'reset-password':
      return 'Reset Password - Kixora';

    case 'payment':
      if (segments[1] === 'success') {
        return 'Payment Success - Kixora';
      } else if (segments[1] === 'cancel') {
        return 'Payment Cancelled - Kixora';
      }
      return 'Payment - Kixora';

    case 'admin':
      if (segments.length === 1 || segments[1] === 'dashboard') {
        return 'Admin Dashboard - Kixora';
      }
      switch (segments[1]) {
        case 'orders':
          return 'Manage Orders - Kixora';
        case 'products':
          return 'Manage Products - Kixora';
        case 'categories':
          return 'Manage Categories - Kixora';
        case 'users':
          return 'Manage Users - Kixora';
        case 'audit':
          return 'Audit Logs - Kixora';
        default:
          return 'Admin - Kixora';
      }

    default:
      // Fallback for unknown routes
      return 'Kixora';
  }
};

export const usePageTitle = () => {
  const location = useLocation();

  useEffect(() => {
    const title = getPageTitle(location.pathname);
    document.title = title;
  }, [location.pathname]);
};