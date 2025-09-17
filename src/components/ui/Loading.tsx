import { motion } from 'framer-motion';
import logoWhite from '../../assests/logo.white.png';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  showLogo?: boolean;
  className?: string;
}

const Loading = ({ size = 'md', showLogo = true, className = '' }: LoadingProps) => {
  const dotSizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const logoSizes = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16'
  };

  const containerSizes = {
    sm: 'space-y-4',
    md: 'space-y-6',
    lg: 'space-y-8'
  };

  const bounceVariants = {
    initial: { y: 0 },
    animate: {
      y: [-8, 0, -8],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${containerSizes[size]} ${className}`}>
      {showLogo && (
        <motion.img
          src={logoWhite}
          alt="Kixora"
          className={`${logoSizes[size]} w-auto mb-2`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      <div className="flex space-x-2">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className={`${dotSizes[size]} bg-white rounded-full`}
            variants={bounceVariants}
            initial="initial"
            animate="animate"
            transition={{
              delay: index * 0.2,
              duration: 0.6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Full page loading component
export const PageLoading = ({ className = '' }: { className?: string }) => (
  <div className={`min-h-screen bg-black flex items-center justify-center ${className}`}>
    <Loading size="lg" />
  </div>
);

// Inline loading component (no logo, smaller)
export const InlineLoading = ({ size = 'sm', className = '' }: Pick<LoadingProps, 'size' | 'className'>) => (
  <Loading size={size} showLogo={false} className={className} />
);

export default Loading;