import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconColor: 'text-red-400',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
          titleColor: 'text-red-400',
        };
      case 'warning':
        return {
          iconColor: 'text-orange-400',
          confirmButton: 'bg-orange-600 hover:bg-orange-700 text-white',
          titleColor: 'text-orange-400',
        };
      case 'info':
        return {
          iconColor: 'text-blue-400',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
          titleColor: 'text-blue-400',
        };
      default:
        return {
          iconColor: 'text-red-400',
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
          titleColor: 'text-red-400',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            onTouchEnd={onClose}
            className="absolute inset-0 bg-black/50 touch-manipulation"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 touch-manipulation"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2 touch-manipulation"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="p-6">
              {/* Icon */}
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-gray-100 rounded-full mb-4">
                <AlertTriangle className={`w-6 h-6 ${styles.iconColor}`} />
              </div>

              {/* Title */}
              <h3 className={`text-lg font-semibold text-center mb-2 ${styles.titleColor}`}>
                {title}
              </h3>

              {/* Message */}
              <p className="text-gray-600 text-center mb-6 text-sm leading-relaxed">
                {message}
              </p>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClose();
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onConfirm();
                  }}
                  disabled={loading}
                  className={`flex-1 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation ${styles.confirmButton}`}
                >
                  {loading ? 'Processing...' : confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;