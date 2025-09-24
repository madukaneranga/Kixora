import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle } from 'lucide-react';
import whatsappIcon from '../../assests/whatsapp.png';

interface WhatsAppChatProps {
  phoneNumber: string;
  message?: string;
  businessName?: string;
}

const WhatsAppChat: React.FC<WhatsAppChatProps> = ({
  phoneNumber,
  message = "Hello! I'm interested in your products.",
  businessName = "Kixora"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const openWhatsApp = () => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setShowTooltip(false); // Hide tooltip when menu opens
  };

  // Show tooltip after 3 seconds, hide after user interaction
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen) {
        setShowTooltip(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isOpen]);

  // Auto-hide tooltip after 5 seconds
  useEffect(() => {
    if (showTooltip) {
      const timer = setTimeout(() => {
        setShowTooltip(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [showTooltip]);

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {/* Chat Bubble */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl border p-4 w-64 md:w-72"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-white">
                  <img src={whatsappIcon} alt="WhatsApp" className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{businessName}</p>
                  <p className="text-xs text-green-500">Online</p>
                </div>
              </div>
              <button
                onClick={toggleChat}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-sm text-gray-700">
                  Hi! 👋 How can we help you today?
                </p>
              </div>

              <button
                onClick={openWhatsApp}
                className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg py-2 px-4 text-sm font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <img src={whatsappIcon} alt="WhatsApp" className="w-4 h-4 brightness-0 invert" />
                <span>Start Chat</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Tooltip */}
      <AnimatePresence>
        {showTooltip && !isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            className="absolute bottom-3 right-14 bg-black text-white px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
          >
            Need help?
            {/* Speech bubble tail */}
            <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-black border-t-2 border-b-2 border-t-transparent border-b-transparent"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Button - Same animation and style as ScrollToTop */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleChat}
        className="bg-black text-white border-2 border-white w-12 h-12 md:w-12 md:h-12 sm:w-10 sm:h-10 flex items-center justify-center shadow-lg hover:bg-gray-900 transition-colors duration-300"
        title="Chat with us on WhatsApp"
      >
        <MessageCircle size={20} className="md:w-5 md:h-5 sm:w-4 sm:h-4" />
      </motion.button>
    </div>
  );
};

export default WhatsAppChat;