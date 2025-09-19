import { useState, useEffect } from 'react';
import { ClipboardList, Filter, Search, Eye, ChevronLeft, ChevronRight, LayoutDashboard } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabaseAdmin, isUserAdmin } from '../../lib/supabaseAdmin';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Breadcrumb from '../../components/ui/Breadcrumb';

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data: any;
  new_data: any;
  user_id: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  } | null;
}

const AuditLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [filters, setFilters] = useState({
    table_name: 'all',
    action: 'all',
    search: ''
  });

  useEffect(() => {
    if (user) {
      fetchAuditLogs();
    }
  }, [user]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);

      if (!user) {
        throw new Error('User not authenticated');
      }

      const isAdmin = await isUserAdmin(user.id);
      if (!isAdmin) {
        throw new Error('Access denied: Admin privileges required');
      }

      // Build base query for counting
      let countQuery = supabaseAdmin
        .from('audit_logs')
        .select('*', { count: 'exact', head: true });

      // Build query for fetching data
      let dataQuery = supabaseAdmin
        .from('audit_logs')
        .select(`
          *,
          profiles (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .range(
          (currentPage - 1) * itemsPerPage,
          currentPage * itemsPerPage - 1
        );

      // Apply filters to both queries
      if (filters.table_name !== 'all') {
        countQuery = countQuery.eq('table_name', filters.table_name);
        dataQuery = dataQuery.eq('table_name', filters.table_name);
      }

      if (filters.action !== 'all') {
        countQuery = countQuery.eq('action', filters.action);
        dataQuery = dataQuery.eq('action', filters.action);
      }

      if (filters.search) {
        const searchFilter = `record_id.ilike.%${filters.search}%,user_id.ilike.%${filters.search}%`;
        countQuery = countQuery.or(searchFilter);
        dataQuery = dataQuery.or(searchFilter);
      }

      // Execute both queries
      const [{ count }, { data, error }] = await Promise.all([
        countQuery,
        dataQuery
      ]);

      if (error) throw error;

      setLogs(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    const debounceTimer = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when filters change
      fetchAuditLogs();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [filters, user]);

  useEffect(() => {
    if (!user) return;

    fetchAuditLogs();
  }, [currentPage, itemsPerPage, user]);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'text-green-400 bg-green-900/20 border-green-400/20';
      case 'UPDATE':
        return 'text-blue-400 bg-blue-900/20 border-blue-400/20';
      case 'DELETE':
        return 'text-red-400 bg-red-900/20 border-red-400/20';
      default:
        return 'text-[rgb(94,94,94)] bg-[rgb(25,25,25)] border-[rgb(51,51,51)]';
    }
  };

  const getTableDisplayName = (tableName: string) => {
    const names: { [key: string]: string } = {
      products: 'Products',
      categories: 'Categories',
      orders: 'Orders',
      profiles: 'Users',
      brands: 'Brands',
      collections: 'Collections'
    };
    return names[tableName] || tableName;
  };

  const formatJsonDiff = (oldValues: any, newValues: any) => {
    if (!oldValues && !newValues) {
      return 'Data tracking not available';
    }

    const changes: string[] = [];

    if (oldValues && newValues) {
      // Show what changed - check all keys from both objects
      const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);
      allKeys.forEach(key => {
        if (oldValues[key] !== newValues[key]) {
          const oldVal = oldValues[key] === null ? 'null' : String(oldValues[key]);
          const newVal = newValues[key] === null ? 'null' : String(newValues[key]);
          changes.push(`${key}: ${oldVal} → ${newVal}`);
        }
      });
    } else if (newValues) {
      // INSERT - show new values
      Object.keys(newValues).forEach(key => {
        const value = newValues[key] === null ? 'null' : String(newValues[key]);
        changes.push(`${key}: ${value}`);
      });
    } else if (oldValues) {
      // DELETE - show old values
      Object.keys(oldValues).forEach(key => {
        const value = oldValues[key] === null ? 'null' : String(oldValues[key]);
        changes.push(`${key}: ${value}`);
      });
    }

    if (changes.length === 0) return 'No field changes detected';
    return changes.slice(0, 3).join(', ') + (changes.length > 3 ? '...' : '');
  };

  const renderHighlightedDiff = (oldData: any, newData: any) => {
    if (!oldData || !newData) {
      return null;
    }

    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
    const changes: Array<{ key: string; oldValue: any; newValue: any; type: 'modified' | 'added' | 'removed' }> = [];

    allKeys.forEach(key => {
      const oldValue = oldData[key];
      const newValue = newData[key];

      if (oldValue !== newValue) {
        if (oldValue === undefined) {
          changes.push({ key, oldValue, newValue, type: 'added' });
        } else if (newValue === undefined) {
          changes.push({ key, oldValue, newValue, type: 'removed' });
        } else {
          changes.push({ key, oldValue, newValue, type: 'modified' });
        }
      }
    });

    if (changes.length === 0) {
      return <div className="text-[rgb(94,94,94)] italic">No changes detected</div>;
    }

    return (
      <div className="space-y-2">
        {changes.map(({ key, oldValue, newValue, type }) => (
          <div key={key} className="border border-[rgb(51,51,51)] rounded p-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-white font-medium text-sm">{key}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                type === 'added' ? 'bg-green-900/20 text-green-400' :
                type === 'removed' ? 'bg-red-900/20 text-red-400' :
                'bg-blue-900/20 text-blue-400'
              }`}>
                {type === 'added' ? '+' : type === 'removed' ? '-' : '~'}
              </span>
            </div>
            <div className="text-xs space-y-1">
              {type !== 'added' && (
                <div className="flex items-center space-x-2">
                  <span className="text-red-400 w-4">-</span>
                  <code className="bg-red-900/10 text-red-300 px-1 py-0.5 rounded flex-1 break-all">
                    {oldValue === null ? 'null' : String(oldValue)}
                  </code>
                </div>
              )}
              {type !== 'removed' && (
                <div className="flex items-center space-x-2">
                  <span className="text-green-400 w-4">+</span>
                  <code className="bg-green-900/10 text-green-300 px-1 py-0.5 rounded flex-1 break-all">
                    {newValue === null ? 'null' : String(newValue)}
                  </code>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const tableOptions = [
    { value: 'all', label: 'All Tables' },
    { value: 'products', label: 'Products' },
    { value: 'categories', label: 'Categories' },
    { value: 'orders', label: 'Orders' },
    { value: 'profiles', label: 'Users' },
    { value: 'brands', label: 'Brands' },
    { value: 'collections', label: 'Collections' }
  ];

  const actionOptions = [
    { value: 'all', label: 'All Actions' },
    { value: 'INSERT', label: 'Created' },
    { value: 'UPDATE', label: 'Updated' },
    { value: 'DELETE', label: 'Deleted' }
  ];

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
      label: 'Audit Logs',
      icon: <ClipboardList size={16} />
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} variant="white" />

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Audit Logs</h1>
          <p className="text-[rgb(94,94,94)]">Track all system changes and administrative actions</p>
        </div>

        {/* Filters */}
        <div className="bg-black border border-[rgb(51,51,51)] rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-[rgb(94,94,94)] mb-2">
                Table
              </label>
              <select
                value={filters.table_name}
                onChange={(e) => setFilters({ ...filters, table_name: e.target.value })}
                className="w-full px-3 py-2 bg-black text-white border border-[rgb(51,51,51)] rounded-lg hover:border-[rgb(94,94,94)] focus:outline-none focus:border-white text-sm"
              >
                {tableOptions.map(option => (
                  <option key={option.value} value={option.value} className="bg-black">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgb(94,94,94)] mb-2">
                Action
              </label>
              <select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="w-full px-3 py-2 bg-black text-white border border-[rgb(51,51,51)] rounded-lg hover:border-[rgb(94,94,94)] focus:outline-none focus:border-white text-sm"
              >
                {actionOptions.map(option => (
                  <option key={option.value} value={option.value} className="bg-black">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgb(94,94,94)] mb-2">
                Per Page
              </label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-black text-white border border-[rgb(51,51,51)] rounded-lg hover:border-[rgb(94,94,94)] focus:outline-none focus:border-white text-sm"
              >
                <option value={10} className="bg-black">10</option>
                <option value={20} className="bg-black">20</option>
                <option value={50} className="bg-black">50</option>
                <option value={100} className="bg-black">100</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[rgb(94,94,94)] mb-2">
                Search
              </label>
              <Input
                variant="dark"
                placeholder="Search by record ID or user ID..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-black border border-[rgb(51,51,51)] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[rgb(25,25,25)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Table
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Record ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Changes
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(51,51,51)]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                      {getTableDisplayName(log.table_name)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-[rgb(94,94,94)]">
                      {log.record_id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {log.profiles ? (
                        <div>
                          <div className="text-white">{log.profiles.full_name || 'No Name'}</div>
                          <div className="text-[rgb(94,94,94)] text-xs">{log.profiles.email}</div>
                        </div>
                      ) : (
                        <span className="text-[rgb(94,94,94)]">System</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-[rgb(94,94,94)] max-w-xs truncate">
                      {formatJsonDiff(log.old_data, log.new_data) || 'No changes recorded'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-[rgb(94,94,94)]">
                      <div>{new Date(log.created_at).toLocaleDateString()}</div>
                      <div className="text-xs">{new Date(log.created_at).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedLog(log);
                          setShowModal(true);
                        }}
                        className="border-[rgb(51,51,51)] text-white hover:bg-white hover:text-black"
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {logs.length === 0 && (
            <div className="px-6 py-12 text-center text-[rgb(94,94,94)]">
              <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No audit logs found</p>
              <p className="text-sm mt-1">Changes will appear here when actions are performed</p>
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
                    <span key={`ellipsis-${index}`} className="px-3 py-1 text-[rgb(94,94,94)]">
                      {page}
                    </span>
                  ) : (
                    <Button
                      key={`page-${page}`}
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

        {/* Audit Log Details Modal */}
        {showModal && selectedLog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-black border border-[rgb(51,51,51)] rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-[rgb(51,51,51)] flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">
                  Audit Log Details
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-[rgb(94,94,94)] hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Log Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[rgb(94,94,94)] text-sm">Table</p>
                    <p className="text-white">{getTableDisplayName(selectedLog.table_name)}</p>
                  </div>
                  <div>
                    <p className="text-[rgb(94,94,94)] text-sm">Action</p>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full border ${getActionColor(selectedLog.action)}`}>
                      {selectedLog.action}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[rgb(94,94,94)] text-sm">Record ID</p>
                    <p className="text-white font-mono">{selectedLog.record_id}</p>
                  </div>
                  <div>
                    <p className="text-[rgb(94,94,94)] text-sm">Timestamp</p>
                    <p className="text-white">{new Date(selectedLog.created_at).toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[rgb(94,94,94)] text-sm">Performed By</p>
                  {selectedLog.profiles ? (
                    <div>
                      <p className="text-white">{selectedLog.profiles.full_name || 'No Name'}</p>
                      <p className="text-[rgb(94,94,94)] text-sm">{selectedLog.profiles.email}</p>
                    </div>
                  ) : (
                    <p className="text-white">System</p>
                  )}
                </div>

                {/* Data Changes */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white">Data Changes</h4>

                  {selectedLog.action === 'UPDATE' && selectedLog.old_data && selectedLog.new_data && (
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-sm font-medium text-[rgb(94,94,94)] mb-3">Changed Fields</h5>
                        {renderHighlightedDiff(selectedLog.old_data, selectedLog.new_data)}
                      </div>

                      <details className="group">
                        <summary className="cursor-pointer text-sm text-[rgb(94,94,94)] hover:text-white transition-colors">
                          View Raw JSON Data
                        </summary>
                        <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <h6 className="text-xs font-medium text-[rgb(94,94,94)] mb-2">Before (Raw JSON)</h6>
                            <pre className="bg-[rgb(25,25,25)] border border-[rgb(51,51,51)] rounded p-3 text-xs text-white overflow-x-auto">
                              {JSON.stringify(selectedLog.old_data, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <h6 className="text-xs font-medium text-[rgb(94,94,94)] mb-2">After (Raw JSON)</h6>
                            <pre className="bg-[rgb(25,25,25)] border border-[rgb(51,51,51)] rounded p-3 text-xs text-white overflow-x-auto">
                              {JSON.stringify(selectedLog.new_data, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </details>
                    </div>
                  )}

                  {selectedLog.action === 'INSERT' && selectedLog.new_data && (
                    <div>
                      <h5 className="text-sm font-medium text-[rgb(94,94,94)] mb-2">Created Data</h5>
                      <pre className="bg-[rgb(25,25,25)] border border-[rgb(51,51,51)] rounded p-3 text-xs text-white overflow-x-auto">
                        {JSON.stringify(selectedLog.new_data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {selectedLog.action === 'DELETE' && selectedLog.old_data && (
                    <div>
                      <h5 className="text-sm font-medium text-[rgb(94,94,94)] mb-2">Deleted Data</h5>
                      <pre className="bg-[rgb(25,25,25)] border border-[rgb(51,51,51)] rounded p-3 text-xs text-white overflow-x-auto">
                        {JSON.stringify(selectedLog.old_data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AuditLogs;