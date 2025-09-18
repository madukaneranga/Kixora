import { useState, useEffect } from 'react';
import { Eye, Filter, ChevronLeft, ChevronRight, Package, MapPin, CreditCard, Clock, User, Truck, X } from 'lucide-react';

// Add keyframes for smooth fading animation
const blinkKeyframes = `
  @keyframes slowBlink {
    0% { opacity: 1; }
    50% { opacity: 0.3; }
    100% { opacity: 1; }
  }
`;
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import { supabaseAdmin, isUserAdmin } from '../../lib/supabaseAdmin';
import Button from '../../components/ui/Button';
import { showSuccessToast, showErrorToast } from '../../components/ui/CustomToast';
import { useAuth } from '../../hooks/useAuth';

interface Order {
  id: string;
  order_number: string;
  user_id: string;
  total: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method?: string;
  payment_provider?: string;
  payment_provider_id?: string;
  billing_address?: any; // JSONB
  shipping_address?: any; // JSONB
  shipping_method?: string;
  shipping_cost?: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
  profiles: {
    full_name: string;
    email: string;
  };
  order_items?: Array<{
    id: string;
    order_id: string;
    product_variant_id: string;
    product_title: string; // Snapshot at purchase time
    variant_info: string; // JSONB string containing variant details
    quantity: number;
    unit_price: number;
    total_price: number;
    created_at: string;
    products: {
      title: string;
      image?: string;
    };
    variant_details?: any; // Parsed variant_info JSON
    product_variants?: {
      sku?: string;
    };
  }>;
}

const OrdersManagement = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Verify user is admin before using admin client
      const isAdmin = await isUserAdmin(user.id);
      if (!isAdmin) {
        throw new Error('Access denied: Admin privileges required');
      }

      // Build base query for counting
      let countQuery = supabaseAdmin
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // Build query for fetching data
      let dataQuery = supabaseAdmin
        .from('orders')
        .select(`
          id,
          total,
          currency,
          status,
          created_at,
          payment_method,
          shipping_method,
          user_id,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .range(
          (currentPage - 1) * itemsPerPage,
          currentPage * itemsPerPage - 1
        );

      // Apply status filter to both queries
      if (statusFilter !== 'all') {
        countQuery = countQuery.eq('status', statusFilter);
        dataQuery = dataQuery.eq('status', statusFilter);
      }

      // Execute both queries
      const [{ count }, { data, error }] = await Promise.all([
        countQuery,
        dataQuery
      ]);

      if (error) {
        throw error;
      }

      setOrders(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching orders:', error);
      showErrorToast(`Failed to load orders: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    try {
      setLoadingDetails(true);

      if (!user) {
        throw new Error('User not authenticated');
      }

      const isAdmin = await isUserAdmin(user.id);
      if (!isAdmin) {
        throw new Error('Access denied: Admin privileges required');
      }

      const { data, error } = await supabaseAdmin
        .from('orders')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          ),
          order_items (
            id,
            quantity,
            unit_price,
            total_price,
            product_title,
            variant_info,
            product_variant_id,
            product_variants (
              sku,
              products (
                product_images (
                  storage_path
                )
              )
            )
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;

      // Format the data - using snapshot data from order_items
      const formattedOrder = {
        ...data,
        order_items: data.order_items?.map((item: any) => ({
          ...item,
          products: {
            title: item.product_title, // Use snapshot title
            image: item.product_variants?.products?.product_images?.[0]?.storage_path
          },
          // Handle variant_info (already parsed JSONB object from Supabase)
          variant_details: item.variant_info || null
        }))
      };

      setSelectedOrder(formattedOrder);
    } catch (error) {
      console.error('Error fetching order details:', error);
      showErrorToast('Failed to load order details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdating(orderId);

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Verify user is admin before using admin client
      const isAdmin = await isUserAdmin(user.id);
      if (!isAdmin) {
        throw new Error('Access denied: Admin privileges required');
      }

      const { error } = await supabaseAdmin
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.map(order =>
        order.id === orderId
          ? { ...order, status: newStatus as any }
          : order
      ));

      showSuccessToast('Order status updated successfully');
    } catch (error) {
      console.error('Error updating order:', error);
      showErrorToast('Failed to update order status');
    } finally {
      setUpdating(null);
    }
  };

  // Add effect to refetch when pagination or filters change
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filter changes
  }, [statusFilter]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [currentPage, itemsPerPage, statusFilter]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-green-400 bg-green-900/20 border-green-400/20';
      case 'cancelled':
        return 'text-red-400 bg-red-900/20 border-red-400/20';
      case 'shipped':
        return 'text-blue-400 bg-blue-900/20 border-blue-400/20';
      case 'confirmed':
        return 'text-emerald-400 bg-emerald-900/20 border-emerald-400/20';
      case 'processing':
        return 'text-purple-400 bg-purple-900/20 border-purple-400/20';
      default:
        return 'text-orange-400 bg-orange-900/20 border-orange-400/20';
    }
  };

  const statusOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Inject blinking animation CSS */}
      <style>{blinkKeyframes}</style>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Orders Management</h1>
            <p className="text-[rgb(94,94,94)]">Manage and track customer orders</p>
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-black text-white border border-[rgb(51,51,51)] rounded-lg hover:border-[rgb(94,94,94)] focus:outline-none focus:border-white"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value} className="bg-black">
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-black text-white border border-[rgb(51,51,51)] rounded-lg hover:border-[rgb(94,94,94)] focus:outline-none focus:border-white"
            >
              <option value={10} className="bg-black">10 per page</option>
              <option value={20} className="bg-black">20 per page</option>
              <option value={50} className="bg-black">50 per page</option>
              <option value={100} className="bg-black">100 per page</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-black border border-[rgb(51,51,51)] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[rgb(25,25,25)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(51,51,51)]">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/5">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      #{order.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{order.profiles?.full_name || 'N/A'}</div>
                      <div className="text-sm text-[rgb(94,94,94)]">{order.profiles?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {order.currency} {order.total.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        disabled={updating === order.id}
                        className={`text-sm font-medium capitalize px-3 py-1 rounded-full border ${getStatusColor(order.status)} bg-black`}
                      >
                        <option value="pending" className="bg-black">Pending</option>
                        <option value="confirmed" className="bg-black">Confirmed</option>
                        <option value="processing" className="bg-black">Processing</option>
                        <option value="shipped" className="bg-black">Shipped</option>
                        <option value="delivered" className="bg-black">Delivered</option>
                        <option value="cancelled" className="bg-black">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(94,94,94)]">
                      <div className="capitalize">{order.payment_method}</div>
                      <div className={`text-xs ${
                        (order.status === 'pending' || order.status === 'confirmed' || order.status === 'processing')
                          ? order.shipping_method?.toLowerCase().includes('express')
                            ? 'text-red-400 font-medium'
                            : 'text-yellow-400 font-medium'
                          : ''
                      }`}
                        style={
                          (order.status === 'pending' || order.status === 'confirmed' || order.status === 'processing')
                            ? {
                                animation: 'slowBlink 2s ease-in-out infinite'
                              }
                            : {}
                        }
                      >
                        {order.shipping_method}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(94,94,94)]">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          setShowModal(true);
                          await fetchOrderDetails(order.id);
                        }}
                        className="border-[rgb(51,51,51)] text-white hover:bg-white hover:text-black"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {orders.length === 0 && (
            <div className="px-6 py-12 text-center text-[rgb(94,94,94)]">
              <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No orders found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalCount > itemsPerPage && (
          <div className="bg-black border border-[rgb(51,51,51)] rounded-lg px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div className="text-sm text-[rgb(94,94,94)]">
                Showing {startItem} to {endItem} of {totalCount} results
              </div>

              <div className="flex items-center space-x-2">
                {/* Previous Button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="border-[rgb(51,51,51)] text-white hover:bg-white hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {/* Page Numbers */}
                {generatePageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={index} className="px-3 py-1 text-[rgb(94,94,94)]">
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
                          ? "bg-white text-black"
                          : "border-[rgb(51,51,51)] text-white hover:bg-white hover:text-black"
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
                  className="border-[rgb(51,51,51)] text-white hover:bg-white hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Comprehensive Order Details Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-black border border-[rgb(51,51,51)] rounded-lg w-full max-w-6xl max-h-[95vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-black border-b border-[rgb(51,51,51)] px-6 py-4 flex justify-between items-center z-10">
                <div className="flex items-center space-x-3">
                  <Package className="w-6 h-6 text-white" />
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {selectedOrder?.order_number || `Order #${selectedOrder?.id?.slice(-8).toUpperCase()}` || 'Loading...'}
                    </h3>
                    {selectedOrder && (
                      <p className="text-[rgb(94,94,94)] text-sm">
                        Created {new Date(selectedOrder.created_at).toLocaleDateString()} at {new Date(selectedOrder.created_at).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedOrder(null);
                  }}
                  className="text-[rgb(94,94,94)] hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Loading State */}
              {loadingDetails && !selectedOrder && (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                  <span className="ml-4 text-white">Loading order details...</span>
                </div>
              )}

              {/* Modal Content */}
              {selectedOrder && (
                <div className="p-6 space-y-8">
                  {/* Status & Key Info */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-[rgb(25,25,25)] p-4 rounded-lg border border-[rgb(51,51,51)]">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="w-4 h-4 text-[rgb(94,94,94)]" />
                        <p className="text-[rgb(94,94,94)] text-sm">Status</p>
                      </div>
                      <p className={`text-lg font-semibold capitalize ${getStatusColor(selectedOrder.status).split(' ')[0]}`}>
                        {selectedOrder.status}
                      </p>
                    </div>

                    <div className="bg-[rgb(25,25,25)] p-4 rounded-lg border border-[rgb(51,51,51)]">
                      <div className="flex items-center space-x-2 mb-2">
                        <CreditCard className="w-4 h-4 text-[rgb(94,94,94)]" />
                        <p className="text-[rgb(94,94,94)] text-sm">Total Amount</p>
                      </div>
                      <p className="text-white text-xl font-bold">
                        {selectedOrder.currency} {selectedOrder.total.toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-[rgb(25,25,25)] p-4 rounded-lg border border-[rgb(51,51,51)]">
                      <div className="flex items-center space-x-2 mb-2">
                        <CreditCard className="w-4 h-4 text-[rgb(94,94,94)]" />
                        <p className="text-[rgb(94,94,94)] text-sm">Payment</p>
                      </div>
                      <p className="text-white capitalize">{selectedOrder.payment_method || 'N/A'}</p>
                      <p className={`text-xs mt-1 font-medium ${
                        selectedOrder.payment_status === 'paid' ? 'text-green-400' :
                        selectedOrder.payment_status === 'failed' ? 'text-red-400' :
                        selectedOrder.payment_status === 'refunded' ? 'text-purple-400' :
                        'text-yellow-400'
                      }`}>
                        Status: {selectedOrder.payment_status}
                      </p>
                    </div>

                    <div className="bg-[rgb(25,25,25)] p-4 rounded-lg border border-[rgb(51,51,51)]">
                      <div className="flex items-center space-x-2 mb-2">
                        <Truck className="w-4 h-4 text-[rgb(94,94,94)]" />
                        <p className="text-[rgb(94,94,94)] text-sm">Shipping</p>
                      </div>
                      <p className="text-white capitalize">{selectedOrder.shipping_method}</p>
                      {selectedOrder.tracking_number && (
                        <p className="text-xs text-blue-400 mt-1">#{selectedOrder.tracking_number}</p>
                      )}
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="bg-[rgb(25,25,25)] p-6 rounded-lg border border-[rgb(51,51,51)]">
                    <div className="flex items-center space-x-2 mb-4">
                      <User className="w-5 h-5 text-white" />
                      <h4 className="text-lg font-semibold text-white">Customer Information</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-[rgb(94,94,94)] text-sm">Name</p>
                        <p className="text-white">{selectedOrder.profiles?.full_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[rgb(94,94,94)] text-sm">Email</p>
                        <p className="text-white">{selectedOrder.profiles?.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[rgb(94,94,94)] text-sm">Phone</p>
                        <p className="text-white">{selectedOrder.profiles?.phone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
                    <div className="bg-[rgb(25,25,25)] p-6 rounded-lg border border-[rgb(51,51,51)]">
                      <div className="flex items-center space-x-2 mb-4">
                        <Package className="w-5 h-5 text-white" />
                        <h4 className="text-lg font-semibold text-white">Order Items ({selectedOrder.order_items.length})</h4>
                      </div>
                      <div className="space-y-4">
                        {selectedOrder.order_items.map((item) => (
                          <div key={item.id} className="flex items-center space-x-4 p-4 bg-black rounded-lg border border-[rgb(51,51,51)]">
                            {item.products.image && (
                              <img
                                src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${item.products.image}`}
                                alt={item.products.title}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            )}
                            <div className="flex-1">
                              <p className="text-white font-medium">{item.product_title}</p>
                              <div className="flex items-center space-x-4 text-sm text-[rgb(94,94,94)] mt-1">
                                {item.variant_details?.size && (
                                  <span>Size: {item.variant_details.size}</span>
                                )}
                                {item.variant_details?.color && (
                                  <span>Color: {item.variant_details.color}</span>
                                )}
                                {item.product_variants?.sku && (
                                  <span>SKU: {item.product_variants.sku}</span>
                                )}
                                <span className="text-xs">Unit: {selectedOrder.currency} {item.unit_price.toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-white">Qty: {item.quantity}</p>
                              <p className="text-white font-semibold">
                                {selectedOrder.currency} {item.total_price.toLocaleString()}
                              </p>
                              <p className="text-xs text-[rgb(94,94,94)]">
                                @ {selectedOrder.currency} {item.unit_price.toLocaleString()} each
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Addresses */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Shipping Address */}
                    {selectedOrder.shipping_address && (
                      <div className="bg-[rgb(25,25,25)] p-6 rounded-lg border border-[rgb(51,51,51)]">
                        <div className="flex items-center space-x-2 mb-4">
                          <MapPin className="w-5 h-5 text-white" />
                          <h4 className="text-lg font-semibold text-white">Shipping Address</h4>
                        </div>
                        <div className="text-white text-sm">
                          {typeof selectedOrder.shipping_address === 'string' ? (
                            <p className="text-xs">{selectedOrder.shipping_address}</p>
                          ) : (
                            <div className="space-y-1">
                              {(selectedOrder.shipping_address.firstName || selectedOrder.shipping_address.lastName) && (
                                <p className="text-xs">
                                  <span className="text-gray-400">Name: </span>
                                  <span className="text-white">{selectedOrder.shipping_address.firstName} {selectedOrder.shipping_address.lastName}</span>
                                </p>
                              )}

                              {selectedOrder.shipping_address.address && (
                                <p className="text-xs">
                                  <span className="text-gray-400">Address: </span>
                                  <span className="text-white">{selectedOrder.shipping_address.address}</span>
                                </p>
                              )}

                              {(selectedOrder.shipping_address.city || selectedOrder.shipping_address.postalCode) && (
                                <p className="text-xs">
                                  <span className="text-gray-400">City: </span>
                                  <span className="text-white">
                                    {selectedOrder.shipping_address.city}
                                    {selectedOrder.shipping_address.postalCode && ` ${selectedOrder.shipping_address.postalCode}`}
                                  </span>
                                </p>
                              )}

                              {selectedOrder.shipping_address.phone && (
                                <p className="text-xs">
                                  <span className="text-gray-400">Phone: </span>
                                  <span className="text-white">{selectedOrder.shipping_address.phone}</span>
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Billing Address */}
                    {selectedOrder.billing_address && (
                      <div className="bg-[rgb(25,25,25)] p-6 rounded-lg border border-[rgb(51,51,51)]">
                        <div className="flex items-center space-x-2 mb-4">
                          <CreditCard className="w-5 h-5 text-white" />
                          <h4 className="text-lg font-semibold text-white">Billing Address</h4>
                        </div>
                        <div className="text-white text-sm">
                          {typeof selectedOrder.billing_address === 'string' ? (
                            <p className="text-xs">{selectedOrder.billing_address}</p>
                          ) : (
                            <div className="space-y-1">
                              {(selectedOrder.billing_address.firstName || selectedOrder.billing_address.lastName) && (
                                <p className="text-xs">
                                  <span className="text-gray-400">Name: </span>
                                  <span className="text-white">{selectedOrder.billing_address.firstName} {selectedOrder.billing_address.lastName}</span>
                                </p>
                              )}

                              {selectedOrder.billing_address.address && (
                                <p className="text-xs">
                                  <span className="text-gray-400">Address: </span>
                                  <span className="text-white">{selectedOrder.billing_address.address}</span>
                                </p>
                              )}

                              {(selectedOrder.billing_address.city || selectedOrder.billing_address.postalCode) && (
                                <p className="text-xs">
                                  <span className="text-gray-400">City: </span>
                                  <span className="text-white">
                                    {selectedOrder.billing_address.city}
                                    {selectedOrder.billing_address.postalCode && ` ${selectedOrder.billing_address.postalCode}`}
                                  </span>
                                </p>
                              )}

                              {selectedOrder.billing_address.phone && (
                                <p className="text-xs">
                                  <span className="text-gray-400">Phone: </span>
                                  <span className="text-white">{selectedOrder.billing_address.phone}</span>
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Order Totals Breakdown */}
                  <div className="bg-[rgb(25,25,25)] p-6 rounded-lg border border-[rgb(51,51,51)]">
                    <h4 className="text-lg font-semibold text-white mb-4">Order Summary</h4>
                    <div className="space-y-2">
                      {selectedOrder.subtotal && (
                        <div className="flex justify-between text-[rgb(94,94,94)]">
                          <span>Subtotal:</span>
                          <span>{selectedOrder.currency} {selectedOrder.subtotal.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedOrder.shipping_cost && (
                        <div className="flex justify-between text-[rgb(94,94,94)]">
                          <span>Shipping:</span>
                          <span>{selectedOrder.currency} {selectedOrder.shipping_cost.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedOrder.tax_amount && (
                        <div className="flex justify-between text-[rgb(94,94,94)]">
                          <span>Tax:</span>
                          <span>{selectedOrder.currency} {selectedOrder.tax_amount.toLocaleString()}</span>
                        </div>
                      )}
                      {selectedOrder.discount_amount && (
                        <div className="flex justify-between text-green-400">
                          <span>Discount:</span>
                          <span>-{selectedOrder.currency} {selectedOrder.discount_amount.toLocaleString()}</span>
                        </div>
                      )}
                      <hr className="border-[rgb(51,51,51)]" />
                      <div className="flex justify-between text-white text-lg font-semibold">
                        <span>Total:</span>
                        <span>{selectedOrder.currency} {selectedOrder.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-[rgb(25,25,25)] p-6 rounded-lg border border-[rgb(51,51,51)]">
                      <h4 className="text-lg font-semibold text-white mb-4">Order Timestamps</h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-[rgb(94,94,94)] text-sm">Created</p>
                          <p className="text-white">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                        </div>
                        {selectedOrder.updated_at && (
                          <div>
                            <p className="text-[rgb(94,94,94)] text-sm">Last Updated</p>
                            <p className="text-white">{new Date(selectedOrder.updated_at).toLocaleString()}</p>
                          </div>
                        )}
                        {selectedOrder.estimated_delivery && (
                          <div>
                            <p className="text-[rgb(94,94,94)] text-sm">Estimated Delivery</p>
                            <p className="text-white">{new Date(selectedOrder.estimated_delivery).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notes & Additional Info */}
                    <div className="bg-[rgb(25,25,25)] p-6 rounded-lg border border-[rgb(51,51,51)]">
                      <h4 className="text-lg font-semibold text-white mb-4">Additional Information</h4>
                      <div className="space-y-2">
                        {selectedOrder.order_number && (
                          <div>
                            <p className="text-[rgb(94,94,94)] text-sm">Order Number</p>
                            <p className="text-white font-mono text-sm">{selectedOrder.order_number}</p>
                          </div>
                        )}
                        {selectedOrder.payment_provider && (
                          <div>
                            <p className="text-[rgb(94,94,94)] text-sm">Payment Provider</p>
                            <p className="text-white capitalize">{selectedOrder.payment_provider}</p>
                          </div>
                        )}
                        {selectedOrder.payment_provider_id && (
                          <div>
                            <p className="text-[rgb(94,94,94)] text-sm">Payment Transaction ID</p>
                            <p className="text-white font-mono text-sm">{selectedOrder.payment_provider_id}</p>
                          </div>
                        )}
                        {selectedOrder.user_id && (
                          <div>
                            <p className="text-[rgb(94,94,94)] text-sm">Customer ID</p>
                            <p className="text-white font-mono text-sm">{selectedOrder.user_id}</p>
                          </div>
                        )}
                        {selectedOrder.notes && (
                          <div>
                            <p className="text-[rgb(94,94,94)] text-sm">Order Notes</p>
                            <p className="text-white">{selectedOrder.notes}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-[rgb(94,94,94)] text-sm">Order ID (UUID)</p>
                          <p className="text-white font-mono text-sm">{selectedOrder.id}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default OrdersManagement;