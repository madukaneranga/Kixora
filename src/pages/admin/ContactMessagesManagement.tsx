import { useState, useEffect } from 'react';
import { Eye, MessageCircle, CheckCircle, Clock, XCircle, LayoutDashboard, Search } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabaseAdmin, isUserAdmin } from '../../lib/supabaseAdmin';
import { useAuth } from '../../hooks/useAuth';
import Breadcrumb from '../../components/ui/Breadcrumb';
import { showSuccessToast, showErrorToast } from '../../components/ui/CustomToast';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  mobile: string | null;
  subject: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
}

const ContactMessagesManagement = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user]);

  const fetchMessages = async () => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const isAdmin = await isUserAdmin(user.id);
      if (!isAdmin) {
        throw new Error('Access denied: Admin privileges required');
      }

      const { data, error } = await supabaseAdmin
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching contact messages:', error);
      showErrorToast('Failed to fetch contact messages');
    } finally {
      setLoading(false);
    }
  };

  const updateMessageStatus = async (messageId: string, status: ContactMessage['status']) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const isAdmin = await isUserAdmin(user.id);
      if (!isAdmin) {
        throw new Error('Access denied: Admin privileges required');
      }

      const { error } = await supabaseAdmin
        .from('contact_messages')
        .update({ status })
        .eq('id', messageId);

      if (error) {
        throw error;
      }

      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, status } : msg
        )
      );

      showSuccessToast('Message status updated successfully');
    } catch (error) {
      console.error('Error updating message status:', error);
      showErrorToast('Failed to update message status');
    }
  };

  const getStatusColor = (status: ContactMessage['status']) => {
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

  const getStatusIcon = (status: ContactMessage['status']) => {
    switch (status) {
      case 'new':
        return <MessageCircle size={16} />;
      case 'in_progress':
        return <Clock size={16} />;
      case 'resolved':
        return <CheckCircle size={16} />;
      case 'closed':
        return <XCircle size={16} />;
      default:
        return <MessageCircle size={16} />;
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || message.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStats = () => {
    return {
      total: messages.length,
      new: messages.filter(m => m.status === 'new').length,
      inProgress: messages.filter(m => m.status === 'in_progress').length,
      resolved: messages.filter(m => m.status === 'resolved').length,
      closed: messages.filter(m => m.status === 'closed').length
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
      label: 'Contact Messages'
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
          <h1 className="text-2xl font-bold text-white mb-2">Contact Messages</h1>
          <p className="text-[rgb(94,94,94)]">Manage customer contact form submissions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-black border border-[rgb(51,51,51)] rounded-lg p-4">
            <p className="text-[rgb(94,94,94)] text-sm">Total Messages</p>
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
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[rgb(94,94,94)] w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, email, or subject..."
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
        </div>

        {/* Messages Table */}
        <div className="bg-black border border-[rgb(51,51,51)] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[rgb(25,25,25)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Contact Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(94,94,94)] uppercase tracking-wider">
                    Subject
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
                {filteredMessages.map((message) => (
                  <tr key={message.id} className="hover:bg-[rgb(25,25,25)]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">{message.name}</div>
                        <div className="text-sm text-[rgb(94,94,94)]">{message.email}</div>
                        {message.mobile && (
                          <div className="text-xs text-blue-400">WhatsApp: {message.mobile}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white max-w-xs truncate">{message.subject}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
                        {getStatusIcon(message.status)}
                        <span className="ml-1 capitalize">{message.status.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(94,94,94)]">
                      {new Date(message.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedMessage(message)}
                        className="text-blue-400 hover:text-blue-300 flex items-center mr-3"
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

          {filteredMessages.length === 0 && (
            <div className="px-6 py-8 text-center text-[rgb(94,94,94)]">
              No contact messages found
            </div>
          )}
        </div>

        {/* Message Detail Modal */}
        {selectedMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-black border border-[rgb(51,51,51)] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-[rgb(51,51,51)] flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Contact Message Details</h3>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-[rgb(94,94,94)] hover:text-white"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[rgb(94,94,94)] mb-1">Name</label>
                  <p className="text-white">{selectedMessage.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[rgb(94,94,94)] mb-1">Email</label>
                  <p className="text-white">{selectedMessage.email}</p>
                </div>

                {selectedMessage.mobile && (
                  <div>
                    <label className="block text-sm font-medium text-[rgb(94,94,94)] mb-1">WhatsApp Number</label>
                    <p className="text-white">{selectedMessage.mobile}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-[rgb(94,94,94)] mb-1">Subject</label>
                  <p className="text-white">{selectedMessage.subject}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[rgb(94,94,94)] mb-1">Message</label>
                  <div className="bg-[rgb(25,25,25)] border border-[rgb(51,51,51)] rounded p-3">
                    <p className="text-white whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[rgb(94,94,94)] mb-1">Current Status</label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedMessage.status)}`}>
                    {getStatusIcon(selectedMessage.status)}
                    <span className="ml-1 capitalize">{selectedMessage.status.replace('_', ' ')}</span>
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[rgb(94,94,94)] mb-1">Submitted</label>
                  <p className="text-white">{new Date(selectedMessage.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="p-6 border-t border-[rgb(51,51,51)] flex flex-wrap gap-2">
                <button
                  onClick={() => updateMessageStatus(selectedMessage.id, 'in_progress')}
                  disabled={selectedMessage.status === 'in_progress'}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mark In Progress
                </button>
                <button
                  onClick={() => updateMessageStatus(selectedMessage.id, 'resolved')}
                  disabled={selectedMessage.status === 'resolved'}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mark Resolved
                </button>
                <button
                  onClick={() => updateMessageStatus(selectedMessage.id, 'closed')}
                  disabled={selectedMessage.status === 'closed'}
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

export default ContactMessagesManagement;