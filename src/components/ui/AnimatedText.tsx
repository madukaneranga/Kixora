import { motion } from 'framer-motion';

interface AnimatedTextProps {
  text: string;
  isActive: boolean;
  className?: string;
  delay?: number;
  stagger?: number;
  duration?: number;
  isSecondaryText?: boolean;
}

const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  isActive,
  className = '',
  delay = 0,
  stagger = 0.02,
  duration = 0.6,
  isSecondaryText = false
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.01,
        staggerDirection: -1,
      },
    },
  };

  const characterVariants = {
    hidden: {
      opacity: 0,
      y: 50,
      rotateX: -90,
      scale: 0.8,
    },
    visible: {
      opacity: isSecondaryText ? 0.9 : 1,
      y: 0,
      rotateX: 0,
      scale: 1,
      transition: {
        duration: duration,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
    exit: {
      opacity: 0,
      y: -30,
      rotateX: 90,
      scale: 0.8,
      transition: {
        duration: 0.3,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <motion.div
      className={`${className} overflow-hidden`}
      variants={containerVariants}
      initial="hidden"
      animate={isActive ? "visible" : "exit"}
      style={{ perspective: '1000px' }}
    >
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          variants={characterVariants}
          className={`inline-block ${char === ' ' ? 'w-2 lg:w-4' : ''} ${isSecondaryText ? 'text-white/90' : ''}`}
          style={{
            transformOrigin: 'center bottom',
            transformStyle: 'preserve-3d',
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.div>
  );
};

export default AnimatedText;