import { useState, useEffect } from 'react';
import { ClipboardList, Filter, Search, Eye } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values: any;
  new_values: any;
  user_id: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  } | null;
}

const AuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    table_name: 'all',
    action: 'all',
    search: ''
  });

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          profiles (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters.table_name !== 'all') {
        query = query.eq('table_name', filters.table_name);
      }

      if (filters.action !== 'all') {
        query = query.eq('action', filters.action);
      }

      if (filters.search) {
        query = query.or(`record_id.ilike.%${filters.search}%,user_id.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchAuditLogs();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [filters]);

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
    if (!oldValues && !newValues) return null;

    const changes: string[] = [];

    if (oldValues && newValues) {
      // Show what changed
      Object.keys(newValues).forEach(key => {
        if (oldValues[key] !== newValues[key]) {
          changes.push(`${key}: ${oldValues[key]} → ${newValues[key]}`);
        }
      });
    } else if (newValues) {
      // INSERT - show new values
      Object.keys(newValues).forEach(key => {
        if (newValues[key] !== null) {
          changes.push(`${key}: ${newValues[key]}`);
        }
      });
    } else if (oldValues) {
      // DELETE - show old values
      Object.keys(oldValues).forEach(key => {
        if (oldValues[key] !== null) {
          changes.push(`${key}: ${oldValues[key]}`);
        }
      });
    }

    return changes.slice(0, 3).join(', ') + (changes.length > 3 ? '...' : '');
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
          <h1 className="text-2xl font-bold text-white mb-2">Audit Logs</h1>
          <p className="text-[rgb(94,94,94)]">Track all system changes and administrative actions</p>
        </div>

        {/* Filters */}
        <div className="bg-black border border-[rgb(51,51,51)] rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                      {formatJsonDiff(log.old_values, log.new_values) || 'No changes recorded'}
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

        {/* Audit Log Details Modal */}
        {showModal && selectedLog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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

                  {selectedLog.action === 'UPDATE' && selectedLog.old_values && selectedLog.new_values && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-sm font-medium text-[rgb(94,94,94)] mb-2">Before</h5>
                        <pre className="bg-[rgb(25,25,25)] border border-[rgb(51,51,51)] rounded p-3 text-xs text-white overflow-x-auto">
                          {JSON.stringify(selectedLog.old_values, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-[rgb(94,94,94)] mb-2">After</h5>
                        <pre className="bg-[rgb(25,25,25)] border border-[rgb(51,51,51)] rounded p-3 text-xs text-white overflow-x-auto">
                          {JSON.stringify(selectedLog.new_values, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {selectedLog.action === 'INSERT' && selectedLog.new_values && (
                    <div>
                      <h5 className="text-sm font-medium text-[rgb(94,94,94)] mb-2">Created Data</h5>
                      <pre className="bg-[rgb(25,25,25)] border border-[rgb(51,51,51)] rounded p-3 text-xs text-white overflow-x-auto">
                        {JSON.stringify(selectedLog.new_values, null, 2)}
                      </pre>
                    </div>
                  )}

                  {selectedLog.action === 'DELETE' && selectedLog.old_values && (
                    <div>
                      <h5 className="text-sm font-medium text-[rgb(94,94,94)] mb-2">Deleted Data</h5>
                      <pre className="bg-[rgb(25,25,25)] border border-[rgb(51,51,51)] rounded p-3 text-xs text-white overflow-x-auto">
                        {JSON.stringify(selectedLog.old_values, null, 2)}
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