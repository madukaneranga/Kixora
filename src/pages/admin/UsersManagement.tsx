import { useState, useEffect } from 'react';
import { Eye, UserCheck, UserX, Shield, User, Users, ChevronLeft, ChevronRight, LayoutDashboard, Search } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabaseAdmin, isUserAdmin } from '../../lib/supabaseAdmin';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import { showSuccessToast, showErrorToast } from '../../components/ui/CustomToast';
import Breadcrumb from '../../components/ui/Breadcrumb';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
  _count?: {
    orders: number;
  };
}

interface OrderStats {
  total_orders: number;
  total_spent: number;
}

const UsersManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<OrderStats | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
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
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Build query for fetching data
      let dataQuery = supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .range(
          (currentPage - 1) * itemsPerPage,
          currentPage * itemsPerPage - 1
        );

      // Apply role filter to both queries
      if (roleFilter !== 'all') {
        countQuery = countQuery.eq('role', roleFilter);
        dataQuery = dataQuery.eq('role', roleFilter);
      }

      // Apply search filter to both queries
      if (searchQuery.trim()) {
        const searchTerm = `%${searchQuery.trim()}%`;
        // Search in email and full_name fields
        countQuery = countQuery.or(`email.ilike.${searchTerm},full_name.ilike.${searchTerm}`);
        dataQuery = dataQuery.or(`email.ilike.${searchTerm},full_name.ilike.${searchTerm}`);
      }

      // Execute both queries
      const [{ count }, { data, error }] = await Promise.all([
        countQuery,
        dataQuery
      ]);

      if (error) throw error;

      setUsers(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching users:', error);
      showErrorToast('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async (userId: string) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const isAdmin = await isUserAdmin(user.id);
      if (!isAdmin) {
        throw new Error('Access denied: Admin privileges required');
      }

      const { data, error } = await supabaseAdmin
        .from('orders')
        .select('total')
        .eq('user_id', userId);

      if (error) throw error;

      const stats: OrderStats = {
        total_orders: data?.length || 0,
        total_spent: data?.reduce((sum, order) => sum + (order.total || 0), 0) || 0
      };

      setUserStats(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setUserStats({ total_orders: 0, total_spent: 0 });
    }
  };

  const updateUserRole = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      setUpdating(userId);

      if (!user) {
        throw new Error('User not authenticated');
      }

      const isAdmin = await isUserAdmin(user.id);
      if (!isAdmin) {
        throw new Error('Access denied: Admin privileges required');
      }

      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user =>
        user.id === userId
          ? { ...user, role: newRole }
          : user
      ));

      showSuccessToast(`User role updated to ${newRole} successfully`);
    } catch (error) {
      console.error('Error updating user role:', error);
      showErrorToast('Failed to update user role');
    } finally {
      setUpdating(null);
    }
  };

  const viewUserDetails = async (user: UserProfile) => {
    setSelectedUser(user);
    setShowModal(true);
    await fetchUserStats(user.id);
  };

  // Add effect to refetch when pagination or filters change
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filter or search changes
  }, [roleFilter, searchQuery]);

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [currentPage, itemsPerPage, roleFilter, searchQuery]);

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

  const getRoleColor = (role: string) => {
    return role === 'admin'
      ? 'text-purple-400 bg-purple-900/20 border-purple-400/20'
      : 'text-blue-400 bg-blue-900/20 border-blue-400/20';
  };

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? Shield : User;
  };

  const roleOptions = [
    { value: 'all', label: 'All Users' },
    { value: 'admin', label: 'Admins' },
    { value: 'user', label: 'Users' }
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

  const breadcrumbItems = [
    {
      label: 'Admin',
      path: '/admin',
      icon: <LayoutDashboard size={16} />
    },
    {
      label: 'Users Management',
      icon: <Users size={16} />
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} variant="white" />

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Users Management</h1>
            <p className="text-[rgb(94,94,94)]">Manage user accounts and roles</p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-[rgb(94,94,94)]" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-black text-white border border-[rgb(51,51,51)] rounded-lg hover:border-[rgb(94,94,94)] focus:outline-none focus:border-white placeholder-[rgb(94,94,94)] w-64"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-4 py-2 bg-black text-white border border-[rgb(51,51,51)] rounded-lg hover:border-[rgb(94,94,94)] focus:outline-none focus:border-white"
            >
              {roleOptions.map(option => (
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

        {/* Users Table */}
        <div className="bg-black border border-[rgb(51,51,51)] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[rgb(25,25,25)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(51,51,51)]">
                {users.map((user) => {
                  const RoleIcon = getRoleIcon(user.role);
                  return (
                    <tr key={user.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-[rgb(51,51,51)] rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-[rgb(94,94,94)]" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-white">
                              {user.full_name || 'No Name'}
                            </div>
                            <div className="text-sm text-[rgb(94,94,94)]">
                              ID: {user.id.slice(-8).toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.id, e.target.value as any)}
                          disabled={updating === user.id}
                          className={`text-sm font-medium capitalize px-3 py-1 rounded-full border ${getRoleColor(user.role)} bg-black`}
                        >
                          <option value="user" className="bg-black">User</option>
                          <option value="admin" className="bg-black">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(94,94,94)]">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewUserDetails(user)}
                          className="border-[rgb(51,51,51)] text-white hover:bg-white hover:text-black"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {users.length === 0 && searchQuery ? (
            <div className="px-6 py-12 text-center text-[rgb(94,94,94)]">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No users found matching "{searchQuery}"</p>
            </div>
          ) : users.length === 0 ? (
            <div className="px-6 py-12 text-center text-[rgb(94,94,94)]">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No users found</p>
            </div>
          ) : null}
        </div>

        {/* Pagination */}
        {totalCount > itemsPerPage && (
          <div className="bg-black border border-[rgb(51,51,51)] rounded-lg px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div className="text-sm text-[rgb(94,94,94)]">
                Showing {startItem} to {endItem} of {totalCount} results
                {searchQuery && <span className="text-orange-400"> matching "{searchQuery}"</span>}
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

        {/* User Details Modal */}
        {showModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-black border border-[rgb(51,51,51)] rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-[rgb(51,51,51)] flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">
                  User Details
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedUser(null);
                    setUserStats(null);
                  }}
                  className="text-[rgb(94,94,94)] hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* User Info */}
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-[rgb(51,51,51)] rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-[rgb(94,94,94)]" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-white">
                      {selectedUser.full_name || 'No Name'}
                    </h4>
                    <p className="text-[rgb(94,94,94)]">{selectedUser.email}</p>
                    <div className="flex items-center mt-2">
                      {selectedUser.role === 'admin' ? (
                        <Shield className="w-4 h-4 text-purple-400 mr-1" />
                      ) : (
                        <User className="w-4 h-4 text-blue-400 mr-1" />
                      )}
                      <span className={`text-sm font-medium capitalize ${getRoleColor(selectedUser.role).split(' ')[0]}`}>
                        {selectedUser.role}
                      </span>
                    </div>
                  </div>
                </div>

                {/* User Stats */}
                {userStats && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[rgb(25,25,25)] border border-[rgb(51,51,51)] rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[rgb(94,94,94)] text-sm">Total Orders</p>
                          <p className="text-2xl font-bold text-white">{userStats.total_orders}</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-900/20 rounded-lg flex items-center justify-center">
                          <Eye className="w-5 h-5 text-blue-400" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-[rgb(25,25,25)] border border-[rgb(51,51,51)] rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[rgb(94,94,94)] text-sm">Total Spent</p>
                          <p className="text-2xl font-bold text-white">
                            LKR {userStats.total_spent.toLocaleString()}
                          </p>
                        </div>
                        <div className="w-10 h-10 bg-green-900/20 rounded-lg flex items-center justify-center">
                          <UserCheck className="w-5 h-5 text-green-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Account Details */}
                <div className="space-y-4">
                  <h5 className="text-lg font-semibold text-white">Account Details</h5>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[rgb(94,94,94)] text-sm">User ID</p>
                      <p className="text-white font-mono text-sm">{selectedUser.id}</p>
                    </div>
                    <div>
                      <p className="text-[rgb(94,94,94)] text-sm">Account Status</p>
                      <p className="text-green-400 text-sm">Active</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[rgb(94,94,94)] text-sm">Joined Date</p>
                      <p className="text-white text-sm">
                        {new Date(selectedUser.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[rgb(94,94,94)] text-sm">Last Updated</p>
                      <p className="text-white text-sm">
                        {new Date(selectedUser.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Role Management */}
                <div className="pt-4 border-t border-[rgb(51,51,51)]">
                  <h5 className="text-lg font-semibold text-white mb-4">Role Management</h5>
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={() => updateUserRole(selectedUser.id, selectedUser.role === 'admin' ? 'user' : 'admin')}
                      className={selectedUser.role === 'admin'
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-purple-600 hover:bg-purple-700 text-white"
                      }
                    >
                      {selectedUser.role === 'admin' ? (
                        <>
                          <UserX className="w-4 h-4 mr-2" />
                          Remove Admin
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4 mr-2" />
                          Make Admin
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default UsersManagement;