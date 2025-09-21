import React, { useState } from 'react';
import { X } from 'lucide-react';
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

  const openWhatsApp = () => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {/* Chat Bubble */}
      {isOpen && (
        <div className="mb-4 bg-white rounded-lg shadow-xl border p-4 w-64 animate-in slide-in-from-bottom-2">
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
        </div>
      )}

      {/* WhatsApp Button */}
      <button
        onClick={isOpen ? openWhatsApp : toggleChat}
        className="bg-white hover:bg-gray-50 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 border-2 border-white"
        title="Chat with us on WhatsApp"
      >
        <img
          src={whatsappIcon}
          alt="WhatsApp"
          className="w-7 h-7"
        />
      </button>
    </div>
  );
};

export default WhatsAppChat;