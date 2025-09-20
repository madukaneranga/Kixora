import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowLeft, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useWishlistStore } from '../stores/wishlistStore';
import ProductGrid from '../components/products/ProductGrid';
import Button from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { showSuccessToast, showErrorToast } from '../components/ui/CustomToast';
import Breadcrumb from '../components/ui/Breadcrumb';

const WishlistPage = () => {
  const { user } = useAuth();
  const { items, loading, fetchWishlist, removeFromWishlist } = useWishlistStore();
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchWishlist(user.id);
    }
  }, [user, fetchWishlist]);

  // Fetch full product details for wishlist items
  useEffect(() => {
    const fetchProducts = async () => {
      if (items.length === 0) {
        setProducts([]);
        return;
      }

      try {
        const productIds = items.map(item => item.productId);
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            product_images (storage_path),
            product_variants (id, size, color, stock, is_active, sku)
          `)
          .in('id', productIds)
          .eq('is_active', true)
          .is('deleted_at', null);

        if (error) throw error;

        const productsWithImages = data?.map(product => ({
          ...product,
          image: product.product_images?.[0]?.storage_path,
          images: product.product_images?.map(img => img.storage_path) || [],
          variants: product.product_variants?.filter(v => v.is_active !== false) || []
        })) || [];

        setProducts(productsWithImages);
      } catch (error) {
        console.error('Error fetching wishlist products:', error);
      }
    };

    fetchProducts();
  }, [items]);

  // Filter products based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = products.filter(product =>
        product.title.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.brands?.name?.toLowerCase().includes(query)
      );
      setFilteredProducts(filtered);
    }
  }, [products, searchQuery]);

  const handleClearWishlist = async () => {
    if (!user || items.length === 0) return;

    try {
      // Remove all items from wishlist
      for (const item of items) {
        await removeFromWishlist(user.id, item.productId);
      }
      showSuccessToast('Wishlist cleared');
    } catch (error) {
      showErrorToast('Failed to clear wishlist');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center px-4">
            <Heart className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4 sm:mb-6" />
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-black mb-3">Your Wishlist</h1>
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-sm mx-auto">Please sign in to view your wishlist</p>
            <Link to="/products">
              <Button variant="primary" className="min-h-[44px] px-6">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            {/* Breadcrumb skeleton */}
            <div className="h-4 bg-gray-200 rounded w-20 mb-6"></div>

            {/* Header skeleton */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-5 h-5 bg-gray-200 rounded"></div>
              <div className="h-6 bg-gray-200 rounded w-32"></div>
            </div>

            {/* Grid skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 aspect-[4/5] rounded-lg mb-3"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    {
      label: 'Wishlist',
      icon: <Heart size={16} />
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} className="mb-6" />

        {/* Header */}
        <div className="flex flex-col gap-4 mb-6 sm:mb-8">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link to="/products" className="text-gray-600 hover:text-black">
              <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
            </Link>
            <div className="flex-1">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-black">Your Wishlist</h1>
              <p className="text-xs sm:text-sm text-gray-600">
                {searchQuery ? `${filteredProducts.length} of ${items.length}` : `${items.length}`} item{items.length !== 1 ? 's' : ''}
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
            </div>
          </div>

          {/* Search and Actions */}
          {items.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              {/* Search Input */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search wishlist..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                />
              </div>

              {/* Clear Button */}
              <Button
                variant="outline"
                onClick={handleClearWishlist}
                className="flex items-center justify-center space-x-2 whitespace-nowrap min-h-[40px] sm:min-h-[36px]"
              >
                <Trash2 size={16} />
                <span className="text-sm">Clear All</span>
              </Button>
            </div>
          )}
        </div>

        {/* Wishlist Items */}
        {products.length === 0 && !loading ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8 sm:py-12 px-4"
          >
            <Heart className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4 sm:mb-6" />
            <h2 className="text-xl sm:text-2xl font-semibold text-black mb-3 sm:mb-4">Your wishlist is empty</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-sm mx-auto">Save items you love to buy them later</p>
            <Link to="/products">
              <Button variant="primary" className="flex items-center justify-center space-x-2 min-h-[44px] px-6">
                <ShoppingCart size={16} />
                <span>Continue Shopping</span>
              </Button>
            </Link>
          </motion.div>
        ) : filteredProducts.length === 0 && searchQuery ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8 sm:py-12 px-4"
          >
            <Search className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4 sm:mb-6" />
            <h2 className="text-xl sm:text-2xl font-semibold text-black mb-3 sm:mb-4">No items found</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-sm mx-auto">
              No wishlist items match your search for "<span className="font-medium">{searchQuery}</span>"
            </p>
            <Button
              variant="outline"
              onClick={() => setSearchQuery('')}
              className="flex items-center justify-center space-x-2 min-h-[44px] px-6"
            >
              <X size={16} />
              <span>Clear Search</span>
            </Button>
          </motion.div>
        ) : (
          <ProductGrid products={filteredProducts} loading={loading} />
        )}

        {/* Continue Shopping */}
        {products.length > 0 && (
          <div className="mt-8 sm:mt-12 text-center px-4">
            <Link to="/products">
              <Button variant="outline" className="flex items-center justify-center space-x-2 min-h-[44px] px-6">
                <ArrowLeft size={16} />
                <span>Continue Shopping</span>
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;