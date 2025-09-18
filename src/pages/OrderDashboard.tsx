import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, X, Clock, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import { showErrorToast } from '../components/ui/CustomToast';

interface Order {
  id: string;
  total: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
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
  }>;
}

const OrderDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'arrived' | 'cancelled'>('all');
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [allOrdersCount, setAllOrdersCount] = useState(0);
  const [arrivedCount, setArrivedCount] = useState(0);
  const [cancelledCount, setCancelledCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchOrderCounts();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      // Build base query for counting
      let countQuery = supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);

      // Build query for fetching data
      let dataQuery = supabase
        .from('orders')
        .select(`
          id,
          total,
          currency,
          status,
          created_at,
          order_items (
            id,
            product_title,
            variant_info,
            quantity,
            unit_price,
            total_price,
            product_variant_id
          )
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .range(
          (currentPage - 1) * itemsPerPage,
          currentPage * itemsPerPage - 1
        );

      // Apply status filter to both queries
      if (selectedFilter === 'arrived') {
        countQuery = countQuery.eq('status', 'delivered');
        dataQuery = dataQuery.eq('status', 'delivered');
      } else if (selectedFilter === 'cancelled') {
        countQuery = countQuery.eq('status', 'cancelled');
        dataQuery = dataQuery.eq('status', 'cancelled');
      }

      // Execute both queries
      const [{ count }, { data, error }] = await Promise.all([
        countQuery,
        dataQuery
      ]);

      if (error) throw error;
      setOrders(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching orders:', error);
      showErrorToast('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Add effect to refetch when pagination or filters change
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filter changes
  }, [selectedFilter]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [currentPage, selectedFilter]);

  const fetchOrderCounts = async () => {
    try {
      const [allCount, arrivedCount, cancelledCount] = await Promise.all([
        supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user!.id),
        supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user!.id)
          .eq('status', 'delivered'),
        supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user!.id)
          .eq('status', 'cancelled')
      ]);

      setAllOrdersCount(allCount.count || 0);
      setArrivedCount(arrivedCount.count || 0);
      setCancelledCount(cancelledCount.count || 0);
    } catch (error) {
      console.error('Error fetching order counts:', error);
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalCount);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(1, currentPage - halfVisible);
      let endPage = Math.min(totalPages, currentPage + halfVisible);

      // Adjust to show exactly maxVisiblePages when possible
      if (endPage - startPage + 1 < maxVisiblePages) {
        if (startPage === 1) {
          endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        } else {
          startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
      }

      // Add first page and ellipsis if needed
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push('...');
        }
      }

      // Add visible page numbers
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Add ellipsis and last page if needed
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push('...');
        }
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'cancelled':
        return <X className="w-5 h-5 text-red-600" />;
      case 'shipped':
        return <Package className="w-5 h-5 text-blue-600" />;
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      default:
        return <Clock className="w-5 h-5 text-orange-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-green-600';
      case 'cancelled':
        return 'text-red-600';
      case 'shipped':
        return 'text-blue-600';
      case 'confirmed':
        return 'text-emerald-600';
      default:
        return 'text-orange-600';
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Track and manage your orders</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Filter Orders</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedFilter('all')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedFilter === 'all'
                      ? 'bg-black text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All Orders ({allOrdersCount})
                </button>
                <button
                  onClick={() => setSelectedFilter('arrived')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                    selectedFilter === 'arrived'
                      ? 'bg-black text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>Arrived</span>
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                    {arrivedCount}
                  </span>
                </button>
                <button
                  onClick={() => setSelectedFilter('cancelled')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                    selectedFilter === 'cancelled'
                      ? 'bg-black text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>Cancelled</span>
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                    {cancelledCount}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {orders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-600 mb-6">
                  {selectedFilter === 'all'
                    ? "You haven't placed any orders yet."
                    : `No ${selectedFilter} orders found.`}
                </p>
                <Button onClick={() => navigate('/products')}>Start Shopping</Button>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                  >
                    {/* Order Header */}
                    <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(order.status)}
                            <h3 className="text-sm font-semibold text-gray-900">
                              Order #{order.id.slice(-8).toUpperCase()}
                            </h3>
                          </div>
                          <span className={`text-xs font-medium capitalize px-2 py-1 rounded-full ${getStatusColor(order.status)} ${
                            order.status === 'delivered' ? 'bg-green-100' :
                            order.status === 'cancelled' ? 'bg-red-100' :
                            order.status === 'shipped' ? 'bg-blue-100' :
                            order.status === 'confirmed' ? 'bg-emerald-100' :
                            'bg-orange-100'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="px-6 py-3">
                      <div className="space-y-2">
                        {order.order_items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900 truncate">{item.product_title}</h4>
                              <div className="text-xs text-gray-500">
                                {item.variant_info.color && (
                                  <span>{item.variant_info.color}</span>
                                )}
                                {item.variant_info.color && item.variant_info.size && ' • '}
                                {item.variant_info.size && (
                                  <span>{item.variant_info.size}</span>
                                )}
                                {' • Qty: ' + item.quantity}
                              </div>
                            </div>
                            <div className="text-right ml-2">
                              <div className="text-sm font-medium text-gray-900">
                                LKR {item.total_price.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Footer */}
                    <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-semibold text-gray-900">
                            Total: LKR {order.total.toLocaleString()}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/orders/${order.id}`)}
                          className="border-black text-black hover:bg-black hover:text-white text-xs px-3 py-1"
                        >
                          Details
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Pagination */}
                {totalCount > itemsPerPage && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                      <div className="text-sm text-gray-600">
                        Showing {startItem} to {endItem} of {totalCount} orders
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Previous Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>

                        {/* Page Numbers */}
                        {generatePageNumbers().map((page, index) => (
                          page === '...' ? (
                            <span key={index} className="px-3 py-1 text-gray-500">
                              {page}
                            </span>
                          ) : (
                            <Button
                              key={page}
                              size="sm"
                              variant={page === currentPage ? "default" : "outline"}
                              onClick={() => handlePageChange(page as number)}
                              className={
                                page === currentPage
                                  ? "bg-black text-white"
                                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
                              }
                            >
                              {page}
                            </Button>
                          )
                        ))}

                        {/* Next Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDashboard;