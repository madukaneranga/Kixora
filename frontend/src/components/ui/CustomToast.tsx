import toast from 'react-hot-toast';
import iconWhite from '../../assests/icon.white.tp.png';

interface CustomToastProps {
  message: string;
  type: 'success' | 'error' | 'loading';
}

const CustomToast = ({ message, type }: CustomToastProps) => {
  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600';
      case 'error':
        return 'bg-red-600';
      case 'loading':
        return 'bg-gray-600';
      default:
        return 'bg-black';
    }
  };

  return (
    <div className={`${getBackgroundColor()} text-white px-4 py-2 rounded-lg flex items-center space-x-3 shadow-lg border border-white/10 max-w-sm`}>
      <img
        src={iconWhite}
        alt="Kixora"
        className="h-8 w-8 flex-shrink-0 object-contain"
      />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

// Custom toast functions
export const showSuccessToast = (message: string) => {
  toast.custom((t) => (
    <div
      className={`transition-all duration-300 ease-out ${
        t.visible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-2 scale-95'
      }`}
    >
      <CustomToast message={message} type="success" />
    </div>
  ), {
    duration: 3000,
  });
};

export const showErrorToast = (message: string) => {
  toast.custom((t) => (
    <div
      className={`transition-all duration-300 ease-out ${
        t.visible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-2 scale-95'
      }`}
    >
      <CustomToast message={message} type="error" />
    </div>
  ), {
    duration: 3000,
  });
};

export const showLoadingToast = (message: string) => {
  return toast.custom((t) => (
    <div
      className={`transition-all duration-300 ease-out ${
        t.visible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-2 scale-95'
      }`}
    >
      <CustomToast message={message} type="loading" />
    </div>
  ), {
    duration: Infinity, // Loading toasts should be manually dismissed
  });
};

export default CustomToast;