import { useState, useEffect } from 'react';
import { Eye, AlertTriangle, Clock, CheckCircle, XCircle, LayoutDashboard, Search, Download, Paperclip } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabaseAdmin, isUserAdmin } from '../../lib/supabaseAdmin';
import { useAuth } from '../../hooks/useAuth';
import Breadcrumb from '../../components/ui/Breadcrumb';
import { showSuccessToast, showErrorToast } from '../../components/ui/CustomToast';

interface SupportRequest {
  id: string;
  name: string;
  email: string;
  mobile: string | null;
  order_number: string | null;
  category: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  subject: string;
  description: string;
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
}

interface SupportAttachment {
  id: string;
  support_request_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  created_at: string;
}

const SupportRequestsManagement = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [attachments, setAttachments] = useState<{[key: string]: SupportAttachment[]}>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const isAdmin = await isUserAdmin(user.id);
      if (!isAdmin) {
        throw new Error('Access denied: Admin privileges required');
      }

      const { data: requestsData, error: requestsError } = await supabaseAdmin
        .from('support_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) {
        throw requestsError;
      }

      const { data: attachmentsData, error: attachmentsError } = await supabaseAdmin
        .from('support_attachments')
        .select('*');

      if (attachmentsError) {
        throw attachmentsError;
      }

      // Group attachments by support request ID
      const attachmentsByRequest: {[key: string]: SupportAttachment[]} = {};
      attachmentsData?.forEach(attachment => {
        if (!attachmentsByRequest[attachment.support_request_id]) {
          attachmentsByRequest[attachment.support_request_id] = [];
        }
        attachmentsByRequest[attachment.support_request_id].push(attachment);
      });

      setRequests(requestsData || []);
      setAttachments(attachmentsByRequest);
    } catch (error) {
      console.error('Error fetching support requests:', error);
      showErrorToast('Failed to fetch support requests');
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, status: SupportRequest['status']) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const isAdmin = await isUserAdmin(user.id);
      if (!isAdmin) {
        throw new Error('Access denied: Admin privileges required');
      }

      const { error } = await supabaseAdmin
        .from('support_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) {
        throw error;
      }

      setRequests(prev =>
        prev.map(req =>
          req.id === requestId ? { ...req, status } : req
        )
      );

      if (selectedRequest && selectedRequest.id === requestId) {
        setSelectedRequest({ ...selectedRequest, status });
      }

      showSuccessToast('Request status updated successfully');
    } catch (error) {
      console.error('Error updating request status:', error);
      showErrorToast('Failed to update request status');
    }
  };

  const downloadAttachment = async (attachment: SupportAttachment) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const isAdmin = await isUserAdmin(user.id);
      if (!isAdmin) {
        throw new Error('Access denied: Admin privileges required');
      }

      const { data, error } = await supabaseAdmin.storage
        .from('kixora')
        .download(attachment.file_path);

      if (error) {
        throw error;
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showSuccessToast('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading attachment:', error);
      showErrorToast('Failed to download file');
    }
  };

  const getPriorityColor = (priority: SupportRequest['priority']) => {
    switch (priority) {
      case 'low':
        return 'text-green-400 bg-green-400/10';
      case 'normal':
        return 'text-blue-400 bg-blue-400/10';
      case 'high':
        return 'text-orange-400 bg-orange-400/10';
      case 'critical':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatusColor = (status: SupportRequest['status']) => {
    switch (status) {
      case 'new':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'in_progress':
        return 'text-blue-400 bg-blue-400/10';
      case 'resolved':
        return 'text-green-400 bg-green-400/10';
      case 'closed':
        return 'text-gray-400 bg-gray-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatusIcon = (status: SupportRequest['status']) => {
    switch (status) {
      case 'new':
        return <AlertTriangle size={16} />;
      case 'in_progress':
        return <Clock size={16} />;
      case 'resolved':
        return <CheckCircle size={16} />;
      case 'closed':
        return <XCircle size={16} />;
      default:
        return <AlertTriangle size={16} />;
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (request.order_number && request.order_number.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStats = () => {
    return {
      total: requests.length,
      new: requests.filter(r => r.status === 'new').length,
      inProgress: requests.filter(r => r.status === 'in_progress').length,
      resolved: requests.filter(r => r.status === 'resolved').length,
      closed: requests.filter(r => r.status === 'closed').length,
      critical: requests.filter(r => r.priority === 'critical').length
    };
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
      label: 'Support Requests'
    }
  ];

  const stats = getStats();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} variant="white" />

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Support Requests</h1>
          <p className="text-[rgb(94,94,94)]">Manage customer support tickets and requests</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="bg-black border border-[rgb(51,51,51)] rounded-lg p-4">
            <p className="text-[rgb(94,94,94)] text-sm">Total Requests</p>
            <p className="text-xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-black border border-[rgb(51,51,51)] rounded-lg p-4">
            <p className="text-[rgb(94,94,94)] text-sm">New</p>
            <p className="text-xl font-bold text-yellow-400">{stats.new}</p>
          </div>
          <div className="bg-black border border-[rgb(51,51,51)] rounded-lg p-4">
            <p className="text-[rgb(94,94,94)] text-sm">In Progress</p>
            <p className="text-xl font-bold text-blue-400">{stats.inProgress}</p>
          </div>
          <div className="bg-black border border-[rgb(51,51,51)] rounded-lg p-4">
            <p className="text-[rgb(94,94,94)] text-sm">Resolved</p>
            <p className="text-xl font-bold text-green-400">{stats.resolved}</p>
          </div>
          <div className="bg-black border border-[rgb(51,51,51)] rounded-lg p-4">
            <p className="text-[rgb(94,94,94)] text-sm">Closed</p>
            <p className="text-xl font-bold text-gray-400">{stats.closed}</p>
          </div>
          <div className="bg-black border border-[rgb(51,51,51)] rounded-lg p-4">
            <p className="text-[rgb(94,94,94)] text-sm">Critical</p>
            <p className="text-xl font-bold text-red-400">{stats.critical}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[rgb(94,94,94)] w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, email, subject, category, or order number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black border border-[rgb(51,51,51)] text-white placeholder:text-[rgb(94,94,94)] focus:outline-none focus:ring-1 focus:ring-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-black border border-[rgb(51,51,51)] text-white focus:outline-none focus:ring-1 focus:ring-white"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-black border border-[rgb(51,51,51)] text-white focus:outline-none focus:ring-1 focus:ring-white"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {/* Requests Table */}
        <div className="bg-black border border-[rgb(51,51,51)] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[rgb(25,25,25)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Customer Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Request Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Priority
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
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-[rgb(25,25,25)]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">{request.name}</div>
                        <div className="text-sm text-[rgb(94,94,94)]">{request.email}</div>
                        {request.mobile && (
                          <div className="text-xs text-green-400">WhatsApp: {request.mobile}</div>
                        )}
                        {request.order_number && (
                          <div className="text-xs text-blue-400">Order: {request.order_number}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-white max-w-xs truncate">{request.subject}</div>
                        <div className="text-xs text-[rgb(94,94,94)]">{request.category}</div>
                        {attachments[request.id] && attachments[request.id].length > 0 && (
                          <div className="flex items-center mt-1">
                            <Paperclip size={12} className="text-[rgb(94,94,94)] mr-1" />
                            <span className="text-xs text-[rgb(94,94,94)]">{attachments[request.id].length} file(s)</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                        {request.priority === 'critical' && <AlertTriangle size={12} className="mr-1" />}
                        <span className="capitalize">{request.priority}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1 capitalize">{request.status.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(94,94,94)]">
                      {new Date(request.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="text-blue-400 hover:text-blue-300 flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRequests.length === 0 && (
            <div className="px-6 py-8 text-center text-[rgb(94,94,94)]">
              No support requests found
            </div>
          )}
        </div>

        {/* Request Detail Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-black border border-[rgb(51,51,51)] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-[rgb(51,51,51)] flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Support Request Details</h3>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-[rgb(94,94,94)] hover:text-white"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[rgb(94,94,94)] mb-1">Name</label>
                    <p className="text-white">{selectedRequest.name}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[rgb(94,94,94)] mb-1">Email</label>
                    <p className="text-white">{selectedRequest.email}</p>
                  </div>

                  {selectedRequest.mobile && (
                    <div>
                      <label className="block text-sm font-medium text-[rgb(94,94,94)] mb-1">WhatsApp Number</label>
                      <p className="text-white">{selectedRequest.mobile}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-[rgb(94,94,94)] mb-1">Category</label>
                    <p className="text-white">{selectedRequest.category}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[rgb(94,94,94)] mb-1">Priority</label>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedRequest.priority)}`}>
                      {selectedRequest.priority === 'critical' && <AlertTriangle size={12} className="mr-1" />}
                      <span className="capitalize">{selectedRequest.priority}</span>
                    </span>
                  </div>

                  {selectedRequest.order_number && (
                    <div>
                      <label className="block text-sm font-medium text-[rgb(94,94,94)] mb-1">Order Number</label>
                      <p className="text-white">{selectedRequest.order_number}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-[rgb(94,94,94)] mb-1">Status</label>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                      {getStatusIcon(selectedRequest.status)}
                      <span className="ml-1 capitalize">{selectedRequest.status.replace('_', ' ')}</span>
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[rgb(94,94,94)] mb-1">Subject</label>
                  <p className="text-white">{selectedRequest.subject}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[rgb(94,94,94)] mb-1">Description</label>
                  <div className="bg-[rgb(25,25,25)] border border-[rgb(51,51,51)] rounded p-3">
                    <p className="text-white whitespace-pre-wrap">{selectedRequest.description}</p>
                  </div>
                </div>

                {attachments[selectedRequest.id] && attachments[selectedRequest.id].length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-[rgb(94,94,94)] mb-2">Attachments</label>
                    <div className="space-y-2">
                      {attachments[selectedRequest.id].map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between bg-[rgb(25,25,25)] border border-[rgb(51,51,51)] rounded p-3">
                          <div className="flex items-center">
                            <Paperclip size={16} className="text-[rgb(94,94,94)] mr-2" />
                            <div>
                              <p className="text-white text-sm">{attachment.file_name}</p>
                              <p className="text-[rgb(94,94,94)] text-xs">
                                {(attachment.file_size / 1024).toFixed(1)} KB • {attachment.file_type}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => downloadAttachment(attachment)}
                            className="text-blue-400 hover:text-blue-300 flex items-center"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-[rgb(94,94,94)] mb-1">Submitted</label>
                  <p className="text-white">{new Date(selectedRequest.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="p-6 border-t border-[rgb(51,51,51)] flex flex-wrap gap-2">
                <button
                  onClick={() => updateRequestStatus(selectedRequest.id, 'in_progress')}
                  disabled={selectedRequest.status === 'in_progress'}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mark In Progress
                </button>
                <button
                  onClick={() => updateRequestStatus(selectedRequest.id, 'resolved')}
                  disabled={selectedRequest.status === 'resolved'}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mark Resolved
                </button>
                <button
                  onClick={() => updateRequestStatus(selectedRequest.id, 'closed')}
                  disabled={selectedRequest.status === 'closed'}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default SupportRequestsManagement;