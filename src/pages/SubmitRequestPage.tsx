import React, { useState } from 'react';
import { Upload, X, Send, AlertCircle } from 'lucide-react';
import { showSuccessToast, showErrorToast } from '../components/ui/CustomToast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const SubmitRequestPage: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    orderNumber: '',
    category: '',
    priority: 'normal',
    subject: '',
    description: ''
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain'];

    const validFiles = files.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        showErrorToast(`${file.name} is not a supported file type`);
        return false;
      }
      if (file.size > maxSize) {
        showErrorToast(`${file.name} is too large. Maximum size is 5MB`);
        return false;
      }
      return true;
    });

    if (attachments.length + validFiles.length > 3) {
      showErrorToast('Maximum 3 files allowed');
      return;
    }

    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (supportRequestId: string): Promise<void> => {
    if (attachments.length === 0) return;

    for (const file of attachments) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${supportRequestId}/${fileName}`;

        // Upload file to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('kixora')
          .upload(`support-attachments/${filePath}`, file);

        if (uploadError) {
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }

        // Save file metadata to database
        const { error: dbError } = await supabase
          .from('support_attachments')
          .insert({
            support_request_id: supportRequestId,
            file_name: file.name,
            file_path: `support-attachments/${filePath}`,
            file_size: file.size,
            file_type: file.type
          });

        if (dbError) {
          throw new Error(`Failed to save attachment metadata: ${dbError.message}`);
        }
      } catch (error) {
        throw error;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      showErrorToast('Please sign in to submit a support request');
      return;
    }

    if (!formData.name || !formData.email || !formData.mobile || !formData.category || !formData.subject || !formData.description) {
      showErrorToast('Please fill in all required fields');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      showErrorToast('Please enter a valid email address');
      return;
    }

    if (!/^[\+]?[0-9\s\-\(\)]{8,15}$/.test(formData.mobile)) {
      showErrorToast('Please enter a valid WhatsApp number');
      return;
    }

    setIsSubmitting(true);

    try {
      // Insert support request
      const { data: supportRequest, error: requestError } = await supabase
        .from('support_requests')
        .insert({
          user_id: user.id,
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          order_number: formData.orderNumber || null,
          category: formData.category,
          priority: formData.priority as 'low' | 'normal' | 'high' | 'critical',
          subject: formData.subject,
          description: formData.description
        })
        .select()
        .single();

      if (requestError) {
        throw new Error(`Failed to create support request: ${requestError.message}`);
      }

      // Upload attachments if any
      if (attachments.length > 0) {
        await uploadFiles(supportRequest.id);
      }

      showSuccessToast('Support request submitted successfully! We\'ll get back to you within 24 hours.');
      setFormData({
        name: '',
        email: '',
        mobile: '',
        orderNumber: '',
        category: '',
        priority: 'normal',
        subject: '',
        description: ''
      });
      setAttachments([]);
    } catch (error: any) {
      const errorMessage = error?.message || error?.error?.message || 'Failed to submit request. Please try again.';
      showErrorToast(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    "Order Issue",
    "Product Defect",
    "Shipping Problem",
    "Return/Exchange",
    "Payment Issue",
    "Website Bug",
    "Account Problem",
    "Product Inquiry",
    "Size/Fit Question",
    "Other"
  ];

  const priorities = [
    { value: "low", label: "Low", description: "General question or feedback" },
    { value: "normal", label: "Normal", description: "Standard support request" },
    { value: "high", label: "High", description: "Urgent issue affecting order" },
    { value: "critical", label: "Critical", description: "System down or order emergency" }
  ];

  return (
    <div className="min-h-screen bg-black text-white px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Submit a Support Request</h1>
        <p className="text-sm mb-4">
          Need help with your order or have a specific issue? Submit a detailed support request and our team will assist you.
        </p>

        {!user && (
          <div className="mb-4 p-3 border border-yellow-400 bg-yellow-400 bg-opacity-10 rounded">
            <p className="text-yellow-400 text-xs">
              <strong>Sign in required:</strong> You must be signed in to submit a support request.
              <a href="/auth" className="underline ml-1">Sign in here</a>
            </p>
          </div>
        )}

        <div className="border border-white p-3 mb-4">
          <div className="flex items-start space-x-2">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold mb-1">Before submitting a request:</p>
              <ul className="space-y-1 opacity-90">
                <li>• Check our <a href="/faq" className="underline">FAQ page</a> for quick answers</li>
                <li>• Include your order number if this relates to a specific order</li>
                <li>• Attach photos for product issues or defects</li>
                <li>• Be as detailed as possible to help us resolve your issue faster</li>
              </ul>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="name" className="block text-xs font-medium mb-1">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={isSubmitting || !user}
                className="w-full px-3 py-2 text-xs bg-black border border-white text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-white disabled:opacity-50"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-medium mb-1">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isSubmitting || !user}
                className="w-full px-3 py-2 text-xs bg-black border border-white text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-white disabled:opacity-50"
                placeholder="Enter your email address"
              />
            </div>

            <div>
              <label htmlFor="mobile" className="block text-xs font-medium mb-1">
                WhatsApp Number *
              </label>
              <input
                type="tel"
                id="mobile"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                disabled={isSubmitting || !user}
                className="w-full px-3 py-2 text-xs bg-black border border-white text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-white disabled:opacity-50"
                placeholder="Enter your WhatsApp number (e.g., +94771234567)"
              />
            </div>
          </div>

          {/* Order Information */}
          <div>
            <label htmlFor="orderNumber" className="block text-xs font-medium mb-1">
              Order Number
            </label>
            <input
              type="text"
              id="orderNumber"
              name="orderNumber"
              value={formData.orderNumber}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-xs bg-black border border-white text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-white disabled:opacity-50"
              placeholder="Enter order number (if applicable)"
            />
            <p className="text-xs opacity-70 mt-1">Include your order number if this request relates to a specific order</p>
          </div>

          {/* Request Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="category" className="block text-xs font-medium mb-1">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                disabled={isSubmitting || !user}
                className="w-full px-3 py-2 text-xs bg-black border border-white text-white focus:outline-none focus:ring-1 focus:ring-white disabled:opacity-50"
              >
                <option value="">Select a category</option>
                {categories.map((category, index) => (
                  <option key={index} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-xs font-medium mb-1">
                Priority *
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                disabled={isSubmitting || !user}
                className="w-full px-3 py-2 text-xs bg-black border border-white text-white focus:outline-none focus:ring-1 focus:ring-white disabled:opacity-50"
              >
                {priorities.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label} - {priority.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="subject" className="block text-xs font-medium mb-1">
              Subject *
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-xs bg-black border border-white text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-white disabled:opacity-50"
              placeholder="Brief description of your issue"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-xs font-medium mb-1">
              Detailed Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={4}
              className="w-full px-3 py-2 text-xs bg-black border border-white text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-white disabled:opacity-50 resize-vertical"
              placeholder="Please provide as much detail as possible about your issue..."
            />
          </div>

          {/* File Attachments */}
          <div>
            <label className="block text-xs font-medium mb-1">
              Attachments
            </label>
            <div className="border border-white border-dashed p-3 text-center">
              <Upload size={24} className="mx-auto mb-2 opacity-60" />
              <p className="mb-1 text-xs">Drop files here or click to upload</p>
              <p className="text-xs opacity-70 mb-2">
                Supported: JPG, PNG, WebP, PDF, TXT (Max 5MB each, 3 files max)
              </p>
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp,.pdf,.txt"
                onChange={handleFileUpload}
                disabled={isSubmitting || !user}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-block bg-white text-black px-3 py-1 text-xs font-medium hover:opacity-80 transition-opacity cursor-pointer disabled:opacity-50"
              >
                Choose Files
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-white bg-opacity-5 p-2 border border-white border-opacity-20">
                    <span className="text-xs">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      disabled={isSubmitting || !user}
                      className="text-white hover:opacity-70 transition-opacity disabled:opacity-50"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-white text-black py-2 px-4 text-xs font-medium hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1"
          >
            <Send size={14} />
            <span>{isSubmitting ? 'Submitting Request...' : 'Submit Request'}</span>
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-xs opacity-90">
            Need immediate help? <a href="/contact" className="underline">Contact us directly</a> or check our <a href="/faq" className="underline">FAQ page</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubmitRequestPage;