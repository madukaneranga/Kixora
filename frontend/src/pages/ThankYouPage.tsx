import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import ProductCard from '../components/products/ProductCard';
import logo from '../assests/logo.black.png';
import { InlineLoading } from '../components/ui/Loading';

interface Product {
  id: string;
  title: string;
  brand?: string;
  price: number;
  image?: string;
  featured?: boolean;
  variants?: Array<{
    id: string;
    size: string;
    color: string;
    stock: number;
  }>;
}

const ThankYouPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Get order info from URL params
  const orderTotal = parseFloat(searchParams.get('total') || '0');
  const paymentMethod = searchParams.get('method') as 'payhere' | 'bank' | 'cod' || 'cod';
  const customerName = searchParams.get('name') || 'Customer';
  const orderId = searchParams.get('orderId') || searchParams.get('order_id') || 'UNKNOWN';

  useEffect(() => {
    // Redirect if no order info
    if (!orderTotal || orderTotal === 0) {
      navigate('/');
      return;
    }

    fetchRecommendedProducts();
  }, [orderTotal, navigate]);

  const fetchRecommendedProducts = async () => {
    setLoading(true);
    try {
      const { data: productsData, error } = await supabase
        .from('products')
        .select(`
          id,
          title,
          price,
          featured,
          product_images(storage_path),
          product_variants(id, size, color, stock)
        `)
        .eq('is_active', true)
        .eq('featured', true)
        .limit(8);

      if (error) throw error;

      console.log('Raw products data:', productsData);

      const formattedProducts = productsData?.map(product => ({
        id: product.id,
        title: product.title,
        price: product.price,
        featured: product.featured,
        image: product.product_images?.[0]?.storage_path,
        variants: product.product_variants?.map(variant => ({
          id: variant.id,
          size: variant.size,
          color: variant.color,
          stock: variant.stock,
        })) || [],
      })) || [];

      console.log('Formatted products:', formattedProducts);
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


  const getPaymentMethodMessage = () => {
    switch (paymentMethod) {
      case 'payhere':
        return {
          title: 'Payment Successful!',
          message: 'Your payment has been processed successfully.',
          icon: <Check className="w-12 h-12 text-green-500" />
        };
      case 'bank':
        return {
          title: 'Order Placed!',
          message: 'Please check your email for bank transfer details.',
          icon: <Check className="w-12 h-12 text-blue-500" />
        };
      case 'cod':
        return {
          title: 'Order Confirmed!',
          message: 'You can pay when you receive your order.',
          icon: <Check className="w-12 h-12 text-orange-500" />
        };
      default:
        return {
          title: 'Thank You!',
          message: 'Your order has been placed successfully.',
          icon: <Check className="w-12 h-12 text-green-500" />
        };
    }
  };

  const paymentInfo = getPaymentMethodMessage();

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="relative py-6">
        {/* Continue Shopping - Top Left */}
        <div className="absolute left-4 top-6 sm:left-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-white hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Continue Shopping</span>
          </button>
        </div>

        {/* Logo - Center Top */}
        <div className="flex justify-center">
          <img
            src={logo}
            alt="Kixora"
            className="h-16 w-auto brightness-0 invert"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Success Message */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mb-12"
        >
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
            {paymentInfo.icon}
          </div>

          <h1 className="text-3xl font-bold text-white mb-4">
            {paymentInfo.title}
          </h1>

          <p className="text-gray-300 mb-6 text-lg">
            {paymentInfo.message}
          </p>

          <p className="text-xl text-white mb-6">
            Thank you, <span className="font-semibold">{customerName}</span>!
          </p>

          <div className="bg-white rounded-lg px-8 py-6 inline-block">
            <p className="text-3xl font-bold text-black">
              LKR {orderTotal.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 mt-1">Order Total</p>
          </div>
        </motion.div>

        {/* Order Summary Section */}
        <div className="border border-gray-700 rounded-lg p-6 mb-12">
          <h3 className="text-xl font-semibold text-white mb-6">Order Summary</h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Details */}
            <div>
              <h4 className="font-medium text-white mb-3">Order Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Order ID:</span>
                  <span className="text-white font-mono">#{orderId !== 'UNKNOWN' ? orderId.slice(-8).toUpperCase() : 'UNKNOWN'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Payment Method:</span>
                  <span className="text-white capitalize">
                    {paymentMethod === 'payhere' ? 'PayHere' :
                     paymentMethod === 'bank' ? 'Bank Transfer' :
                     'Cash on Delivery'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Order Status:</span>
                  <span className={`font-medium ${
                    paymentMethod === 'payhere' ? 'text-green-400' :
                    paymentMethod === 'bank' ? 'text-blue-400' :
                    'text-orange-400'
                  }`}>
                    {paymentMethod === 'payhere' ? 'Paid' :
                     paymentMethod === 'bank' ? 'Awaiting Payment' :
                     'Confirmed'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Order Date:</span>
                  <span className="text-white">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div>
              <h4 className="font-medium text-white mb-3">Payment Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal:</span>
                  <span className="text-white">LKR {(orderTotal - 399).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Shipping:</span>
                  <span className="text-white">LKR 399</span>
                </div>
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-white">Total:</span>
                    <span className="text-white">LKR {orderTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h4 className="font-medium text-white mb-3">Customer Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Customer:</span>
                <span className="text-white ml-2 font-medium">{customerName}</span>
              </div>
              <div>
                <span className="text-gray-400">Order Total:</span>
                <span className="text-white ml-2 font-semibold">LKR {orderTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Specific Information */}
          {paymentMethod === 'bank' && (
            <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">!</span>
                  </div>
                </div>
                <div className="ml-3">
                  <h5 className="text-sm font-medium text-blue-400">Bank Transfer Instructions</h5>
                  <p className="text-sm text-blue-300 mt-1">
                    Please check your email for detailed bank transfer instructions. Your order will be processed once payment is received.
                  </p>
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'cod' && (
            <div className="mt-4 p-4 bg-orange-900/20 border border-orange-500/30 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                </div>
                <div className="ml-3">
                  <h5 className="text-sm font-medium text-orange-400">Cash on Delivery</h5>
                  <p className="text-sm text-orange-300 mt-1">
                    You can pay for your order when it's delivered to your address. Please have the exact amount ready.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* You May Also Like Section */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            You May Also Like
          </h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <InlineLoading size="md" />
            </div>
          ) : products.length > 0 ? (
            <div className="relative">
              {/* Navigation Arrows */}
              <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white shadow-lg border border-gray-200 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-gray-50 hover:shadow-xl"
              >
                <ChevronLeft size={20} />
              </button>

              <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white shadow-lg border border-gray-200 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-gray-50 hover:shadow-xl"
              >
                <ChevronRight size={20} />
              </button>

              {/* Product List */}
              <div
                ref={scrollContainerRef}
                className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                {products.map((product) => (
                  <div key={product.id} className="flex-none w-72">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-300 py-12">
              No recommendations available
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default ThankYouPage;