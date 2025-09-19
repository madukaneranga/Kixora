import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from './Button';

interface MiddleBannerProps {
  image?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

const MiddleBanner = ({
  image = 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=1920',
  title = 'Discover',
  subtitle = 'Your Perfect Fit',
  className = ''
}: MiddleBannerProps) => {
  return (
    <section className={`relative h-[40vh] sm:h-[50vh] md:h-[60vh] overflow-hidden ${className}`}>
      {/* Background Image */}
      <motion.div
        initial={{ opacity: 0, scale: 1.1 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute inset-0"
      >
        <img
          src={image}
          alt="Banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </motion.div>

      {/* Content */}
      <div className="absolute bottom-8 sm:bottom-12 md:bottom-16 left-4 sm:left-8 text-white">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
            {title}
            <br />
            <span className="text-white/90">{subtitle}</span>
          </h2>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 0.1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, delay: 0.8 }}
        className="absolute top-10 left-10 w-32 h-32 border border-white/30 rounded-full hidden lg:block"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 0.1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, delay: 1 }}
        className="absolute bottom-10 right-10 w-24 h-24 border border-white/30 rounded-full hidden lg:block"
      />
    </section>
  );
};

export default MiddleBanner;