import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import { showSuccessToast, showErrorToast } from '../components/ui/CustomToast';
import { supabase } from '../lib/supabase';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.mobile || !formData.subject || !formData.message) {
      showErrorToast('Please fill in all required fields');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      showErrorToast('Please enter a valid email address');
      return;
    }

    if (!/^[\+]?[0-9\s\-\(\)]{8,15}$/.test(formData.mobile)) {
      showErrorToast('Please enter a valid mobile number');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert({
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          subject: formData.subject,
          message: formData.message
        });

      if (error) {
        throw error;
      }

      showSuccessToast('Message sent successfully! We\'ll get back to you within 24 hours.');
      setFormData({ name: '', email: '', mobile: '', subject: '', message: '' });
    } catch (error) {
      console.error('Error submitting contact form:', error);
      showErrorToast('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: <Mail size={24} />,
      title: "Email",
      details: "support@inkixora.com",
      action: "mailto:support@inkixora.com"
    },
    {
      icon: <Phone size={24} />,
      title: "Phone",
      details: "+94 74 128 5920",
      action: "tel:+94741285920"
    },
    {
      icon: <Clock size={24} />,
      title: "Business Hours",
      details: "Mon-Fri: 9AM-6PM, Sat, Sun: 10AM-4PM",
      action: null
    }
  ];

  const subjects = [
    "General Inquiry",
    "Order Support",
    "Product Question",
    "Shipping Issue",
    "Return/Exchange",
    "Technical Support",
    "Partnership",
    "Other"
  ];

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8 sm:px-6 sm:py-10 md:px-20 md:py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Contact Us</h1>
        <p className="text-lg mb-12">
          Have a question or need help? We're here to assist you. Reach out to us through any of the methods below.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div>
            <h2 className="text-2xl font-semibold mb-8">Get in Touch</h2>
            <div className="space-y-6">
              {contactInfo.map((info, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">{info.icon}</div>
                  <div>
                    <h3 className="font-semibold mb-1">{info.title}</h3>
                    {info.action ? (
                      <a
                        href={info.action}
                        className="text-white hover:opacity-70 transition-opacity"
                      >
                        {info.details}
                      </a>
                    ) : (
                      <p className="text-white">{info.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Support Options */}
            <div className="mt-12">
              <h3 className="text-xl font-semibold mb-4">Other Ways to Get Help</h3>
              <div className="space-y-3">
                <a
                  href="/faq"
                  className="block border border-white p-4 hover:bg-white hover:bg-opacity-10 transition-colors"
                >
                  <div className="font-medium">Frequently Asked Questions</div>
                  <div className="text-sm opacity-90">Find quick answers to common questions</div>
                </a>
                <a
                  href="/submit-request"
                  className="block border border-white p-4 hover:bg-white hover:bg-opacity-10 transition-colors"
                >
                  <div className="font-medium">Submit a Support Request</div>
                  <div className="text-sm opacity-90">Create a support ticket for detailed assistance</div>
                </a>
                <a
                  href="/delivery"
                  className="block border border-white p-4 hover:bg-white hover:bg-opacity-10 transition-colors"
                >
                  <div className="font-medium">Delivery Information</div>
                  <div className="text-sm opacity-90">Learn about shipping options and policies</div>
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-semibold mb-8">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 bg-black border border-white text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-white disabled:opacity-50"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 bg-black border border-white text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-white disabled:opacity-50"
                  placeholder="Enter your email address"
                />
              </div>

              <div>
                <label htmlFor="mobile" className="block text-sm font-medium mb-2">
                  WhatsApp Number *
                </label>
                <input
                  type="tel"
                  id="mobile"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 bg-black border border-white text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-white disabled:opacity-50"
                  placeholder="Enter your WhatsApp number (e.g., +94771234567)"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-2">
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 bg-black border border-white text-white focus:outline-none focus:ring-1 focus:ring-white disabled:opacity-50"
                >
                  <option value="">Select a subject</option>
                  {subjects.map((subject, index) => (
                    <option key={index} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  rows={6}
                  className="w-full px-4 py-3 bg-black border border-white text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-white disabled:opacity-50 resize-vertical"
                  placeholder="Tell us how we can help you..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-white text-black py-3 px-6 font-medium hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Send size={18} />
                <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
              </button>
            </form>

            <p className="text-sm opacity-90 mt-4">
              * Required fields. We typically respond within 24 hours during business days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;