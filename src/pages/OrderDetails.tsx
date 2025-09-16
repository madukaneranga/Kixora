import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  User,
  Mail,
  Phone,
  CreditCard,
  Calendar,
  Hash
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

interface OrderDetail {
  id: string;
  order_number: string;
  total: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: string;
  shipping_method: string;
  shipping_cost: number;
  created_at: string;
  updated_at: string;
  shipping_address: any;
  billing_address: any;
  estimated_delivery_days: number;
  order_items: Array<{
    id: string;
    product_title: string;
    variant_info: {
      size: string;
      color: string;
      sku: string;
    };
    quantity: number;
    unit_price: number;
    total_price: number;
    product_variant_id: string;
    product_variants?: {
      products?: {
        product_images?: Array<{
          storage_path: string;
        }>;
      };
    };
  }>;
  profiles: {
    full_name: string;
    email: string;
  };
}

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId && user) {
      fetchOrderDetails();
    }
  }, [orderId, user]);

  const fetchOrderDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_title,
            variant_info,
            quantity,
            unit_price,
            total_price,
            product_variant_id,
            product_variants (
              products (
                product_images (
                  storage_path
                )
              )
            )
          ),
          profiles (
            full_name,
            email
          )
        `)
        .eq('id', orderId)
        .eq('user_id', user!.id)
        .single();

      if (error) throw error;

      const orderDate = new Date(data.created_at);
      const currentDate = new Date();
      const daysSinceOrder = Math.floor((currentDate.getTime() - orderDate.getTime()) / (1000 * 3600 * 24));

      setOrder({
        ...data,
        estimated_delivery_days: Math.max(0, 7 - daysSinceOrder)
      });
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to load order details');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusSteps = () => {
    const steps = [
      { key: 'pending', label: 'Ordered', icon: Package },
      { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
      { key: 'processing', label: 'Processing', icon: Clock },
      { key: 'shipped', label: 'Shipped', icon: Truck },
      { key: 'delivered', label: 'Delivered', icon: CheckCircle }
    ];

    const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(order?.status || 'pending');

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-black mb-2">Order not found</h2>
          <Button onClick={() => navigate('/orders')} className="bg-black text-white hover:bg-gray-800">
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  const statusSteps = getStatusSteps();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center text-gray-600 hover:text-black mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span>Back</span>
          </button>

          <div className="border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-bold text-black flex items-center">
                  <Hash className="w-4 h-4 mr-1" />
                  {order.order_number || `${order.id.slice(-8).toUpperCase()}`}
                </h1>
                <p className="text-sm text-gray-600 flex items-center mt-1">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2 mt-3 sm:mt-0">
                <span className="px-2 py-1 text-xs font-medium border border-black bg-white text-black">
                  {order.status.toUpperCase()}
                </span>
                <span className={`px-2 py-1 text-xs font-medium border ${
                  order.payment_status === 'paid'
                    ? 'border-black bg-black text-white'
                    : 'border-gray-400 bg-white text-gray-600'
                }`}>
                  {order.payment_status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress */}
        {order.status !== 'cancelled' && (
          <div className="border border-gray-200 p-4 mb-6">
            <h2 className="text-sm font-semibold text-black mb-4">PROGRESS</h2>
            <div className="relative">
              <div className="flex items-center justify-between">
                {statusSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.key} className="flex flex-col items-center relative z-10">
                      <div className={`w-8 h-8 border-2 flex items-center justify-center ${
                        step.completed
                          ? 'border-black bg-black text-white'
                          : step.current
                          ? 'border-black bg-white text-black'
                          : 'border-gray-300 bg-white text-gray-300'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <p className={`text-xs mt-2 text-center ${
                        step.completed ? 'text-black font-medium' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Progress Lines */}
              <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4">
                {statusSteps.slice(0, -1).map((step, index) => (
                  <div
                    key={`line-${index}`}
                    className={`h-0.5 flex-1 mx-4 ${
                      statusSteps[index + 1].completed ? 'bg-black' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Order Info */}
          <div className="border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-black mb-3">ORDER DETAILS</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Payment:</span>
                <span className="text-black font-medium capitalize">{order.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping:</span>
                <span className="text-black font-medium capitalize">{order.shipping_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery:</span>
                <span className="text-black font-medium">
                  {order.estimated_delivery_days > 0
                    ? (order.shipping_method === 'standard'
                        ? `2 - 4 business days`
                        : order.shipping_method === 'express'
                          ? (new Date(order.created_at).getHours() < 11 ? `Same day` : `Next day`)
                          : `Processing`)
                    : order.status === 'delivered' ? 'Delivered' : 'Processing'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Customer */}
          <div className="border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-black mb-3">CUSTOMER</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <User className="w-3 h-3 mr-2 text-gray-400" />
                <span className="text-black">{order.profiles?.full_name || 'N/A'}</span>
              </div>
              <div className="flex items-center">
                <Mail className="w-3 h-3 mr-2 text-gray-400" />
                <span className="text-gray-600 text-xs">{order.profiles?.email || 'N/A'}</span>
              </div>
              <div className="flex items-center">
                <Phone className="w-3 h-3 mr-2 text-gray-400" />
                <span className="text-gray-600">{order.billing_address?.phone || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-black mb-3">SHIPPING ADDRESS</h3>
            {order.shipping_address ? (
              <div className="text-sm text-gray-700 space-y-1">
                <p className="text-black font-medium">
                  {order.shipping_address.firstName} {order.shipping_address.lastName}
                </p>
                <p>{order.shipping_address.address}</p>
                {order.shipping_address.apartment && <p>{order.shipping_address.apartment}</p>}
                <p>{order.shipping_address.city}, {order.shipping_address.postalCode}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No address</p>
            )}
          </div>

          {/* Billing Address */}
          <div className="border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-black mb-3">BILLING ADDRESS</h3>
            {order.billing_address ? (
              <div className="text-sm text-gray-700 space-y-1">
                <p className="text-black font-medium">
                  {order.billing_address.firstName} {order.billing_address.lastName}
                </p>
                <p>{order.billing_address.address}</p>
                {order.billing_address.apartment && <p>{order.billing_address.apartment}</p>}
                <p>{order.billing_address.city}, {order.billing_address.postalCode}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No address</p>
            )}
          </div>
        </div>

        {/* Products */}
        <div className="border border-gray-200">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold text-black">ITEMS</h3>
          </div>

          {order.order_items.map((item, index) => (
            <div key={item.id} className={`p-4 ${index !== order.order_items.length - 1 ? 'border-b border-gray-200' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-100 border border-gray-200 flex-shrink-0">
                    {item.product_variants?.products?.product_images?.[0]?.storage_path ? (
                      <img
                        src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${item.product_variants.products.product_images[0].storage_path}`}
                        alt={item.product_title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-black">{item.product_title}</h4>
                    <div className="text-xs text-gray-500 mt-1">
                      {item.variant_info.color && `${item.variant_info.color}`}
                      {item.variant_info.color && item.variant_info.size && ' • '}
                      {item.variant_info.size && `Size ${item.variant_info.size}`}
                      {' • Qty: ' + item.quantity}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-black">
                    LKR {item.total_price.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    @ LKR {item.unit_price.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Total */}
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-black">LKR {(order.total - order.shipping_cost).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping:</span>
                <span className="text-black">LKR {order.shipping_cost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                <span className="text-black">Total:</span>
                <span className="text-black">LKR {order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;