import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { HeroCollection } from '../../types/collection';
import AnimatedText from './AnimatedText';

interface CollectionSlideProps {
  collection: HeroCollection;
  isActive: boolean;
}

const CollectionSlide: React.FC<CollectionSlideProps> = ({ collection, isActive }) => {
  const slideVariants = {
    enter: {
      opacity: 1,
      scale: 1,
    },
    exit: {
      opacity: 0.8,
      scale: 0.95,
    },
  };

  const textVariants = {
    enter: {
      opacity: 1,
      y: 0,
      transition: { delay: 0.2, duration: 0.6 }
    },
    exit: {
      opacity: 0,
      y: 20,
      transition: { duration: 0.3 }
    }
  };

  return (
    <div className="relative h-[60vh] sm:h-[70vh] md:h-[80vh] lg:h-[85vh] text-white overflow-hidden">
      {/* Background Image */}
      <motion.div
        className="absolute inset-0"
        variants={slideVariants}
        animate={isActive ? "enter" : "exit"}
        transition={{ duration: 0.8 }}
      >
        <img
          src={collection.image_url || 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=1920'}
          alt={collection.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30"></div>
      </motion.div>

      {/* Content */}
      <motion.div
        className="absolute bottom-20 sm:bottom-24 md:bottom-28 lg:bottom-32 left-4 right-4 sm:left-8 sm:right-8 flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6 lg:gap-0"
        variants={textVariants}
        animate={isActive ? "enter" : "exit"}
      >
        {/* Bottom Left - Collection Title */}
        <motion.div
          className="flex flex-col justify-end"
          variants={textVariants}
          animate={isActive ? "enter" : "exit"}
        >
          <div className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl xl:text-9xl font-black leading-none tracking-tight uppercase">
            {collection.name.split(' ').map((word, index) => (
              <div key={`${collection.id}-${index}`} className="block">
                <AnimatedText
                  text={word}
                  isActive={isActive}
                  delay={0.3 + (index * 0.15)}
                  stagger={0.03}
                  duration={0.8}
                  isSecondaryText={index > 0}
                  className="block"
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bottom Right - Description & Button */}
        <motion.div
          className="flex flex-col justify-end space-y-4 sm:space-y-6 max-w-sm lg:text-right"
          variants={textVariants}
          animate={isActive ? "enter" : "exit"}
        >
          <div className="space-y-3 sm:space-y-4">
            <p className="text-sm sm:text-base lg:text-lg font-light leading-relaxed">
              {collection.description || `Discover our curated selection of ${collection.name.toLowerCase()}. Premium quality meets exceptional style.`}
            </p>
          </div>

          {/* Shop Now Button */}
          <motion.div
            className="lg:ml-auto"
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={isActive ?
              {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: {
                  delay: 0.8,
                  duration: 0.6,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }
              } :
              {
                opacity: 0,
                y: 20,
                scale: 0.9,
                transition: {
                  duration: 0.4
                }
              }
            }
          >
            <Link to={`/collections/${collection.slug}`}>
              <button className="group relative inline-flex items-center gap-2 bg-white text-black font-medium text-sm sm:text-base px-6 py-3 sm:px-8 sm:py-4 border-2 border-white transition-all duration-300 hover:bg-transparent hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent">
                <motion.span
                  className="relative z-10 tracking-wide"
                  initial={{ opacity: 0 }}
                  animate={isActive ?
                    {
                      opacity: 1,
                      transition: {
                        delay: 1.0,
                        duration: 0.4
                      }
                    } :
                    {
                      opacity: 0,
                      transition: { duration: 0.2 }
                    }
                  }
                >
                  SHOP NOW
                </motion.span>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={isActive ?
                    {
                      opacity: 1,
                      x: 0,
                      transition: {
                        delay: 1.1,
                        duration: 0.4
                      }
                    } :
                    {
                      opacity: 0,
                      x: -10,
                      transition: { duration: 0.2 }
                    }
                  }
                >
                  <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px] relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
                </motion.div>
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CollectionSlide;