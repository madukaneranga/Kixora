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
    whatsapp: `https://api.whatsapp.com/send?text=${shareTitle}%20${shareUrl}`,
    telegram: `https://t.me/share/url?url=${shareUrl}&text=${shareTitle}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${shareUrl}&description=${shareTitle}`,
    reddit: `https://reddit.com/submit?url=${shareUrl}&title=${shareTitle}`
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

              <button
                onClick={() => handleShare('telegram')}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 rounded"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" className="text-blue-500">
                  <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-.14.1-.18.18-.18.4-.9 1.01-2.61 1.82-.35.18-.67.27-.96.26-.32-.01-.93-.18-1.39-.33-.56-.18-.82-.28-.79-.59.01-.17.18-.28.48-.33z"/>
                </svg>
                <span>Share on Telegram</span>
              </button>

              <button
                onClick={() => handleShare('pinterest')}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 rounded"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" className="text-red-600">
                  <path fill="currentColor" d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.219-5.219 1.219-5.219s-.31-.619-.31-1.538c0-1.448.839-2.527 1.887-2.527.889 0 1.318.664 1.318 1.46 0 .89-.567 2.219-.859 3.449-.245 1.03.516 1.87 1.528 1.87 1.834 0 3.244-1.93 3.244-4.716 0-2.466-1.771-4.189-4.307-4.189-2.93 0-4.648 2.197-4.648 4.472 0 .886.343 1.836.771 2.35.085.103.097.193.072.298-.08.33-.256 1.037-.29 1.183-.045.186-.145.226-.333.136-1.254-.584-2.039-2.414-2.039-3.885 0-3.247 2.36-6.229 6.799-6.229 3.568 0 6.341 2.54 6.341 5.931 0 3.538-2.235 6.384-5.335 6.384-1.042 0-2.024-.542-2.357-1.188 0 0-.516 1.965-.641 2.447-.232.893-.86 2.012-1.282 2.695C9.675 23.763 10.816 24 12.017 24c6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z"/>
                </svg>
                <span>Share on Pinterest</span>
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