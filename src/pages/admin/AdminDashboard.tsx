import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, Users, DollarSign, Eye } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabaseAdmin, isUserAdmin } from '../../lib/supabaseAdmin';
import { useAuth } from '../../hooks/useAuth';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
}

interface RecentOrder {
  id: string;
  total: number;
  status: string;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Verify user is admin before using admin client
      const isAdmin = await isUserAdmin(user.id);
      if (!isAdmin) {
        throw new Error('Access denied: Admin privileges required');
      }

      // Fetch stats in parallel using admin client
      const [productsRes, ordersRes, usersRes, recentOrdersRes] = await Promise.all([
        supabaseAdmin.from('products').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('orders').select('id, total', { count: 'exact' }),
        supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
        supabaseAdmin
          .from('orders')
          .select(`
            *,
            profiles (
              full_name,
              email
            )
          `)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      // Calculate total revenue
      const totalRevenue = ordersRes.data?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

      setStats({
        totalProducts: productsRes.count || 0,
        totalOrders: ordersRes.count || 0,
        totalUsers: usersRes.count || 0,
        totalRevenue
      });

      setRecentOrders(recentOrdersRes.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-green-400';
      case 'cancelled':
        return 'text-red-400';
      case 'shipped':
        return 'text-blue-400';
      default:
        return 'text-orange-400';
    }
  };

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
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-[rgb(94,94,94)]">Overview of your eCommerce store</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-black border border-[rgb(51,51,51)] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[rgb(94,94,94)] text-sm">Total Products</p>
                <p className="text-2xl font-bold text-white">{stats.totalProducts}</p>
              </div>
              <Package className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-black border border-[rgb(51,51,51)] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[rgb(94,94,94)] text-sm">Total Orders</p>
                <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-black border border-[rgb(51,51,51)] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[rgb(94,94,94)] text-sm">Total Users</p>
                <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-black border border-[rgb(51,51,51)] rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[rgb(94,94,94)] text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-white">LKR {stats.totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-black border border-[rgb(51,51,51)] rounded-lg">
          <div className="px-6 py-4 border-b border-[rgb(51,51,51)]">
            <h3 className="text-lg font-semibold text-white">Recent Orders</h3>
          </div>

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
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(51,51,51)]">
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      #{order.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{order.profiles?.full_name || 'N/A'}</div>
                      <div className="text-sm text-[rgb(94,94,94)]">{order.profiles?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      LKR {order.total.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium capitalize ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(94,94,94)]">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        to={`/admin/orders`}
                        className="text-blue-400 hover:text-blue-300 flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {recentOrders.length === 0 && (
            <div className="px-6 py-8 text-center text-[rgb(94,94,94)]">
              No orders found
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;