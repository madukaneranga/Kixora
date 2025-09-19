import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowLeft, Search } from 'lucide-react';
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
          variants: product.product_variants || []
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <Heart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h1 className="text-xl md:text-2xl font-bold text-black mb-3">Your Wishlist</h1>
            <p className="text-sm text-gray-600 mb-6">Please sign in to view your wishlist</p>
            <Link to="/products">
              <Button variant="primary">
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border-2 border-gray-200">
                  <div className="flex space-x-4">
                    <div className="w-24 h-24 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center space-x-4">
            <Link to="/products" className="text-gray-600 hover:text-black">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-black">Your Wishlist</h1>
              <p className="text-sm text-gray-600">
                {searchQuery ? `${filteredProducts.length} of ${items.length}` : `${items.length}`} item{items.length !== 1 ? 's' : ''}
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            {items.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search wishlist..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm w-64"
                />
              </div>
            )}

            {items.length > 0 && (
              <Button
                variant="outline"
                onClick={handleClearWishlist}
                className="flex items-center space-x-2 whitespace-nowrap"
              >
                <Trash2 size={16} />
                <span>Clear All</span>
              </Button>
            )}
          </div>
        </div>

        {/* Wishlist Items */}
        {products.length === 0 && !loading ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8 sm:py-12"
          >
            <Heart className="mx-auto h-16 w-16 text-gray-400 mb-6" />
            <h2 className="text-2xl font-semibold text-black mb-4">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-8">Save items you love to buy them later</p>
            <Link to="/products">
              <Button variant="primary" className="flex items-center space-x-2">
                <ShoppingCart size={16} />
                <span>Continue Shopping</span>
              </Button>
            </Link>
          </motion.div>
        ) : filteredProducts.length === 0 && searchQuery ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8 sm:py-12"
          >
            <Search className="mx-auto h-16 w-16 text-gray-400 mb-6" />
            <h2 className="text-2xl font-semibold text-black mb-4">No items found</h2>
            <p className="text-gray-600 mb-8">No wishlist items match your search for "{searchQuery}"</p>
            <Button
              variant="outline"
              onClick={() => setSearchQuery('')}
              className="flex items-center space-x-2"
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
          <div className="mt-12 text-center">
            <Link to="/products">
              <Button variant="outline" className="flex items-center space-x-2">
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