import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ChevronLeft, ChevronRight, ShoppingCart, Heart } from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';
import { useWishlistStore } from '../../stores/wishlistStore';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import Button from './Button';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  title: string;
  brand?: string;
  price: number;
  image?: string;
  variants?: Array<{
    id: string;
    size: string;
    color: string;
    stock: number;
  }>;
}

interface ThankYouPopupProps {
  isOpen: boolean;
  onClose: () => void;
  orderTotal: number;
  paymentMethod: 'payhere' | 'bank' | 'cod';
  customerName?: string;
}

const ThankYouPopup = ({
  isOpen,
  onClose,
  orderTotal,
  paymentMethod,
  customerName
}: ThankYouPopupProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCartStore();
  const { addToWishlist, isInWishlist } = useWishlistStore();
  const { user } = useAuth();


  // Fetch recommended products
  useEffect(() => {
    if (isOpen) {
      fetchRecommendedProducts();
    }
  }, [isOpen]);

  const fetchRecommendedProducts = async () => {
    setLoading(true);
    try {
      const { data: productsData, error } = await supabase
        .from('products')
        .select(`
          id,
          title,
          price,
          product_images!inner(storage_path),
          product_variants!inner(id, size, color, stock)
        `)
        .eq('is_active', true)
        .eq('featured', true)
        .limit(8);

      if (error) throw error;

      const formattedProducts = productsData?.map(product => ({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.product_images?.[0]?.storage_path,
        variants: product.product_variants?.map(variant => ({
          id: variant.id,
          size: variant.size,
          color: variant.color,
          stock: variant.stock,
        })) || [],
      })) || [];

      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error fetching recommended products:', error);
    } finally {
      setLoading(false);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 280;
      const newScrollLeft = scrollContainerRef.current.scrollLeft +
        (direction === 'right' ? scrollAmount : -scrollAmount);

      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const handleQuickAdd = (product: Product) => {
    const firstAvailableVariant = product.variants?.find(v => v.stock > 0);

    if (!firstAvailableVariant) {
      toast.error('Product is out of stock');
      return;
    }

    addItem({
      productId: product.id,
      variantId: firstAvailableVariant.id,
      title: product.title,
      variant: {
        size: firstAvailableVariant.size,
        color: firstAvailableVariant.color,
        sku: `${product.id}-${firstAvailableVariant.id}`,
      },
      price: product.price,
      quantity: 1,
      image: product.image,
      maxStock: firstAvailableVariant.stock,
    });

    toast.success('Added to cart');
  };

  const handleWishlistToggle = async (product: Product) => {
    if (!user) {
      toast.error('Please sign in to add to wishlist');
      return;
    }

    try {
      if (isInWishlist(product.id)) {
        // Would need removeFromWishlist functionality
        toast.info('Already in wishlist');
      } else {
        await addToWishlist(user.id, product.id);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      console.error('Wishlist error:', error);
      toast.error('Something went wrong');
    }
  };

  const getPaymentMethodMessage = () => {
    switch (paymentMethod) {
      case 'payhere':
        return {
          title: 'Payment Successful!',
          message: 'Your payment has been processed successfully.',
          icon: <Check className="w-8 h-8 text-green-500" />
        };
      case 'bank':
        return {
          title: 'Order Placed!',
          message: 'Please check your email for bank transfer details.',
          icon: <Check className="w-8 h-8 text-blue-500" />
        };
      case 'cod':
        return {
          title: 'Order Confirmed!',
          message: 'You can pay when you receive your order.',
          icon: <Check className="w-8 h-8 text-orange-500" />
        };
      default:
        return {
          title: 'Thank You!',
          message: 'Your order has been placed successfully.',
          icon: <Check className="w-8 h-8 text-green-500" />
        };
    }
  };

  const paymentInfo = getPaymentMethodMessage();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-green-50 to-blue-50 p-8 text-center border-b">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>

              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                  {paymentInfo.icon}
                </div>

                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {paymentInfo.title}
                  </h2>
                  <p className="text-gray-600 mb-2">
                    {paymentInfo.message}
                  </p>
                  {customerName && (
                    <p className="text-lg text-gray-800">
                      Thank you, <span className="font-semibold">{customerName}</span>!
                    </p>
                  )}
                </div>

                <div className="bg-white rounded-lg px-6 py-3 shadow-sm">
                  <p className="text-2xl font-bold text-gray-900">
                    LKR {orderTotal.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">Order Total</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* You May Also Like Section */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                  You May Also Like
                </h3>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                  </div>
                ) : products.length > 0 ? (
                  <div className="relative">
                    {/* Navigation Arrows */}
                    <button
                      onClick={() => scroll('left')}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-lg border border-gray-200 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-gray-50 hover:shadow-xl"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    <button
                      onClick={() => scroll('right')}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-lg border border-gray-200 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-gray-50 hover:shadow-xl"
                    >
                      <ChevronRight size={16} />
                    </button>

                    {/* Product List */}
                    <div
                      ref={scrollContainerRef}
                      className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
                      style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                      }}
                    >
                      {products.map((product) => (
                        <div
                          key={product.id}
                          className="flex-none w-64 bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                        >
                          {/* Product Image */}
                          <div className="relative h-48 bg-gray-100">
                            {product.image ? (
                              <img
                                src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${product.image}`}
                                alt={product.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ShoppingCart className="h-12 w-12 text-gray-400" />
                              </div>
                            )}

                            {/* Wishlist Button */}
                            <button
                              onClick={() => handleWishlistToggle(product)}
                              className="absolute top-2 right-2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                            >
                              <Heart
                                size={16}
                                className={isInWishlist(product.id) ? 'text-red-500 fill-current' : 'text-gray-600'}
                              />
                            </button>
                          </div>

                          {/* Product Info */}
                          <div className="p-4">
                            <h4 className="font-medium text-sm text-gray-900 mb-1 line-clamp-2">
                              {product.title}
                            </h4>
                            <p className="text-lg font-bold text-gray-900 mb-3">
                              LKR {product.price.toLocaleString()}
                            </p>

                            {/* Quick Add Button */}
                            <Button
                              variant="primary"
                              size="sm"
                              fullWidth
                              onClick={() => handleQuickAdd(product)}
                              disabled={!product.variants?.some(v => v.stock > 0)}
                              className="bg-black text-white hover:bg-gray-800 text-xs"
                            >
                              <ShoppingCart size={14} className="mr-1" />
                              Quick Add
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No recommendations available
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Continue Shopping
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    onClose();
                    window.location.href = '/';
                  }}
                  className="flex-1 bg-black text-white hover:bg-gray-800"
                >
                  Go Home
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ThankYouPopup;