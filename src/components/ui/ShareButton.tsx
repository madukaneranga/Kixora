import React, { useState } from 'react';
import { Share2, Facebook, Twitter, Linkedin, Copy, MessageCircle } from 'lucide-react';

interface ShareButtonProps {
  url?: string;
  title?: string;
  description?: string;
  className?: string;
  variant?: 'icon' | 'full' | 'dropdown';
}

const ShareButton: React.FC<ShareButtonProps> = ({
  url = window.location.href,
  title = document.title,
  description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
  className = '',
  variant = 'icon'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = encodeURIComponent(url);
  const shareTitle = encodeURIComponent(title);
  const shareDescription = encodeURIComponent(description);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
    whatsapp: `https://api.whatsapp.com/send?text=${shareTitle} ${shareUrl}`,
    telegram: `https://t.me/share/url?url=${shareUrl}&text=${shareTitle}`
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url
        });
      } catch (error) {
        console.error('Native sharing failed:', error);
      }
    } else {
      setIsOpen(!isOpen);
    }
  };

  if (variant === 'icon') {
    return (
      <div className={`relative ${className}`}>
        <button
          onClick={handleNativeShare}
          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          title="Share"
        >
          <Share2 size={16} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px]">
            <div className="p-2 space-y-1">
              <button
                onClick={() => handleShare('facebook')}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 rounded"
              >
                <Facebook size={16} className="text-blue-600" />
                <span>Share on Facebook</span>
              </button>

              <button
                onClick={() => handleShare('twitter')}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 rounded"
              >
                <Twitter size={16} className="text-blue-400" />
                <span>Share on Twitter</span>
              </button>

              <button
                onClick={() => handleShare('linkedin')}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 rounded"
              >
                <Linkedin size={16} className="text-blue-700" />
                <span>Share on LinkedIn</span>
              </button>

              <button
                onClick={() => handleShare('whatsapp')}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 rounded"
              >
                <MessageCircle size={16} className="text-green-500" />
                <span>Share on WhatsApp</span>
              </button>

              <div className="border-t border-gray-200 my-1"></div>

              <button
                onClick={handleCopyLink}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 rounded"
              >
                <Copy size={16} className="text-gray-600" />
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        <button
          onClick={() => handleShare('facebook')}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <Facebook size={16} />
          <span>Facebook</span>
        </button>

        <button
          onClick={() => handleShare('twitter')}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-400 text-white rounded hover:bg-blue-500 transition-colors"
        >
          <Twitter size={16} />
          <span>Twitter</span>
        </button>

        <button
          onClick={() => handleShare('linkedin')}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 transition-colors"
        >
          <Linkedin size={16} />
          <span>LinkedIn</span>
        </button>

        <button
          onClick={handleCopyLink}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        >
          <Copy size={16} />
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
    );
  }

  return null;
};

export default ShareButton;