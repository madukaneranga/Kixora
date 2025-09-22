import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnnouncementBarProps {
  message: string;
  storageKey?: string;
  expirationDays?: number;
  className?: string;
}

const AnnouncementBar: React.FC<AnnouncementBarProps> = ({
  message,
  storageKey = 'announcement-bar-dismissed',
  expirationDays = 14,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has previously dismissed this announcement and if it's still valid
    const dismissalData = localStorage.getItem(storageKey);

    if (!dismissalData) {
      // Never dismissed before - show the announcement
      setIsVisible(true);
    } else {
      try {
        const { timestamp } = JSON.parse(dismissalData);
        const dismissalDate = new Date(timestamp);
        const now = new Date();
        const daysSinceDismissal = Math.floor((now.getTime() - dismissalDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysSinceDismissal >= expirationDays) {
          // Dismissal has expired - show the announcement again
          setIsVisible(true);
          // Clean up expired entry
          localStorage.removeItem(storageKey);
        }
      } catch (error) {
        // Invalid data format - show the announcement
        setIsVisible(true);
        localStorage.removeItem(storageKey);
      }
    }
  }, [storageKey, expirationDays]);

  const handleDismiss = () => {
    setIsVisible(false);
    // Store dismissal timestamp in localStorage
    const dismissalData = {
      timestamp: new Date().toISOString(),
      expirationDays
    };
    localStorage.setItem(storageKey, JSON.stringify(dismissalData));
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className={`bg-black text-white relative overflow-hidden ${className}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-2 sm:py-3">
              {/* Message */}
              <div className="flex-1 flex justify-center">
                <p className="text-xs sm:text-sm font-medium text-center">
                  {message}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 ml-4 p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors duration-200 group"
                aria-label="Dismiss announcement"
              >
                <X
                  size={16}
                  className="text-white group-hover:text-white transition-colors"
                />
              </button>
            </div>
          </div>

          {/* Optional: Add a subtle bottom border */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white via-50% to-transparent opacity-20" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnnouncementBar;