import React, { useState, useEffect } from 'react';
import { Eye, MessageCircle, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { showSuccessToast, showErrorToast } from '../components/ui/CustomToast';

interface SupportRequest {
  id: string;
  user_id: string;
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

const MyRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserRequests();
    }
  }, [user]);

  const fetchUserRequests = async () => {
    try {
      if (!user) return;

      // Fetch support requests by user_id
      const { data: supportData, error: supportError } = await supabase
        .from('support_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (supportError) {
        console.error('Error fetching support requests:', supportError);
        showErrorToast('Failed to fetch your requests');
      } else {
        setSupportRequests(supportData || []);
      }
    } catch (error) {
      console.error('Error fetching user requests:', error);
      showErrorToast('Failed to fetch your requests');
    } finally {
      setLoading(false);
    }
  };

  const cancelSupportRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('support_requests')
        .update({ status: 'closed' })
        .eq('id', requestId)
        .eq('user_id', user?.id); // Ensure user can only cancel their own requests

      if (error) {
        throw error;
      }

      setSupportRequests(prev =>
        prev.map(req =>
          req.id === requestId ? { ...req, status: 'closed' as const } : req
        )
      );

      showSuccessToast('Support request cancelled successfully');
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error cancelling support request:', error);
      showErrorToast('Failed to cancel support request');
    }
  };

  const getStatusColor = (status: string) => {
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

  const getStatusIcon = (status: string) => {
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

  const getPriorityColor = (priority: string) => {
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

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white px-4 py-8 sm:px-6 sm:py-10 md:px-20 md:py-12">
        <div className="max-w-4xl mx-auto text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-yellow-400" />
          <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
          <p className="text-lg">Please sign in to view your requests.</p>
          <a href="/auth" className="inline-block mt-4 bg-white text-black px-6 py-2 font-medium hover:opacity-80 transition-opacity">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white px-4 py-8 sm:px-6 sm:py-10 md:px-20 md:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">My Support Requests</h1>
          <p className="text-sm text-gray-400">Track the status of your support requests and get updates on your issues.</p>
        </div>

        {/* Support Requests */}
        <div>
          {supportRequests.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle size={32} className="mx-auto mb-3 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No support requests</h3>
              <p className="text-gray-400 mb-4 text-sm">You haven't submitted any support requests yet.</p>
              <a
                href="/submit-request"
                className="inline-block bg-white text-black px-4 py-2 text-sm font-medium hover:opacity-80 transition-opacity"
              >
                Submit Request
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {supportRequests.map((request) => (
                <div key={request.id} className="border border-white p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{request.subject}</h3>
                      <p className="text-sm text-gray-400">
                        {request.category} • Submitted on {new Date(request.created_at).toLocaleDateString()}
                      </p>
                      {request.order_number && (
                        <p className="text-sm text-blue-400">Order: {request.order_number}</p>
                      )}
                    </div>
                    <div className="flex flex-col space-y-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1 capitalize">{request.status.replace('_', ' ')}</span>
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                        {request.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-300 mb-4 line-clamp-2">{request.description}</p>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="text-blue-400 hover:text-blue-300 flex items-center"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </button>
                    {request.status !== 'closed' && request.status !== 'resolved' && (
                      <button
                        onClick={() => cancelSupportRequest(request.id)}
                        className="text-red-400 hover:text-red-300 flex items-center"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Cancel Request
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Request Detail Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-black border border-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-white flex justify-between items-center">
                <h3 className="text-lg font-semibold">Support Request Details</h3>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Subject</label>
                  <p className="text-white">{selectedRequest.subject}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                  <p className="text-white">{selectedRequest.category}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Priority</label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedRequest.priority)}`}>
                    {selectedRequest.priority.toUpperCase()}
                  </span>
                </div>

                {selectedRequest.order_number && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Order Number</label>
                    <p className="text-white">{selectedRequest.order_number}</p>
                  </div>
                )}

                {selectedRequest.mobile && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">WhatsApp Number</label>
                    <p className="text-white">{selectedRequest.mobile}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                  <div className="bg-gray-900 border border-gray-700 rounded p-3">
                    <p className="text-white whitespace-pre-wrap">{selectedRequest.description}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                    {getStatusIcon(selectedRequest.status)}
                    <span className="ml-1 capitalize">{selectedRequest.status.replace('_', ' ')}</span>
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Submitted</label>
                  <p className="text-white">{new Date(selectedRequest.created_at).toLocaleString()}</p>
                </div>

                {selectedRequest.updated_at !== selectedRequest.created_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Last Updated</label>
                    <p className="text-white">{new Date(selectedRequest.updated_at).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {selectedRequest.status !== 'closed' && selectedRequest.status !== 'resolved' && (
                <div className="p-6 border-t border-white">
                  <button
                    onClick={() => cancelSupportRequest(selectedRequest.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                  >
                    Cancel Request
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRequestsPage;