import { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';

interface Announcement {
  id: string;
  title: string;
  message: string;
  background_color: string;
  text_color: string;
  link_url: string | null;
}

const AnnouncementBar: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchAnnouncements();
    loadDismissedAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('id, title, message, background_color, text_color, link_url')
        .eq('is_active', true)
        .lte('start_date', new Date().toISOString())
        .or('end_date.is.null,end_date.gte.' + new Date().toISOString())
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const loadDismissedAnnouncements = () => {
    const dismissed = localStorage.getItem('dismissed-announcements');
    if (dismissed) {
      try {
        setDismissedIds(JSON.parse(dismissed));
      } catch (error) {
        console.error('Error parsing dismissed announcements:', error);
        localStorage.removeItem('dismissed-announcements');
      }
    }
  };

  const saveDismissedAnnouncements = (ids: string[]) => {
    localStorage.setItem('dismissed-announcements', JSON.stringify(ids));
  };

  // Filter out dismissed announcements
  const activeAnnouncements = announcements.filter(
    announcement => !dismissedIds.includes(announcement.id)
  );

  useEffect(() => {
    if (activeAnnouncements.length > 0) {
      setIsVisible(true);

      // Auto-rotate announcements if there are multiple
      if (activeAnnouncements.length > 1) {
        const interval = setInterval(() => {
          setCurrentIndex((prevIndex) =>
            (prevIndex + 1) % activeAnnouncements.length
          );
        }, 5000); // Change every 5 seconds

        return () => clearInterval(interval);
      }
    } else {
      setIsVisible(false);
    }
  }, [activeAnnouncements.length]);

  const handleDismiss = () => {
    if (activeAnnouncements.length > 0) {
      const currentAnnouncement = activeAnnouncements[currentIndex];
      const newDismissedIds = [...dismissedIds, currentAnnouncement.id];
      setDismissedIds(newDismissedIds);
      saveDismissedAnnouncements(newDismissedIds);

      // If this was the last announcement, hide the bar
      if (newDismissedIds.length >= announcements.length) {
        setIsVisible(false);
      } else {
        // Move to next announcement if available
        const remainingAnnouncements = activeAnnouncements.filter(
          a => !newDismissedIds.includes(a.id)
        );
        if (remainingAnnouncements.length > 0) {
          setCurrentIndex(currentIndex >= remainingAnnouncements.length ? 0 : currentIndex);
        }
      }
    }
  };

  const handleAnnouncementClick = () => {
    const currentAnnouncement = activeAnnouncements[currentIndex];
    if (currentAnnouncement?.link_url) {
      window.open(currentAnnouncement.link_url, '_blank');
    }
  };

  if (!isVisible || activeAnnouncements.length === 0) {
    return null;
  }

  const currentAnnouncement = activeAnnouncements[currentIndex];

  return (
    <AnimatePresence>
      {isVisible && currentAnnouncement && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="relative overflow-hidden"
          style={{
            backgroundColor: currentAnnouncement.background_color,
            color: currentAnnouncement.text_color
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-2 sm:py-3">
              {/* Message with Animation - Takes full width */}
              <div className="flex-1 flex justify-center relative h-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${currentAnnouncement.id}-${currentIndex}`}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    className={`absolute inset-0 flex items-center justify-center ${
                      currentAnnouncement.link_url ? 'cursor-pointer hover:opacity-80' : ''
                    }`}
                    onClick={handleAnnouncementClick}
                  >
                    <p className="text-xs sm:text-sm font-medium text-center flex items-center gap-2">
                      {currentAnnouncement.message}
                      {currentAnnouncement.link_url && (
                        <ExternalLink size={14} className="opacity-70" />
                      )}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Right side controls - Dots and Close */}
              <div className="flex items-center gap-3 ml-4">
                {/* Dots indicator for multiple announcements */}
                {activeAnnouncements.length > 1 && (
                  <div className="flex items-center space-x-1">
                    {activeAnnouncements.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-2 h-2 rounded-full transition-opacity duration-200 ${
                          index === currentIndex
                            ? 'opacity-100'
                            : 'opacity-40 hover:opacity-70'
                        }`}
                        style={{ backgroundColor: currentAnnouncement.text_color }}
                        aria-label={`Go to announcement ${index + 1}`}
                      />
                    ))}
                  </div>
                )}

                {/* Close Button */}
                <button
                  onClick={handleDismiss}
                  className="flex-shrink-0 p-1 rounded-full transition-colors duration-200 group hover:bg-black hover:bg-opacity-20"
                  style={{ color: currentAnnouncement.text_color }}
                  aria-label="Dismiss announcement"
                >
                  <X
                    size={16}
                    className="transition-colors group-hover:opacity-80"
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Progress bar for auto-rotation */}
          {activeAnnouncements.length > 1 && (
            <motion.div
              className="absolute bottom-0 left-0 h-0.5 opacity-30"
              style={{ backgroundColor: currentAnnouncement.text_color }}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 5, ease: 'linear', repeat: Infinity }}
            />
          )}

          {/* Subtle border */}
          <div
            className="absolute bottom-0 left-0 right-0 h-px opacity-20"
            style={{
              background: `linear-gradient(to right, transparent, ${currentAnnouncement.text_color} 50%, transparent)`
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnnouncementBar;