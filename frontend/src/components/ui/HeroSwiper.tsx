import { useEffect, useState, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Swiper as SwiperType } from 'swiper';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

import { fetchActiveCollections } from '../../services/collectionsService';
import { HeroCollection } from '../../types/collection';
import CollectionSlide from './CollectionSlide';

const HeroSwiper = () => {
  const [collections, setCollections] = useState<HeroCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperType>();

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const data = await fetchActiveCollections();
      setCollections(data);
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSlideChange = (swiper: SwiperType) => {
    setActiveIndex(swiper.activeIndex);
  };

  const goToPrev = () => {
    if (swiperRef.current) {
      swiperRef.current.slidePrev();
    }
  };

  const goToNext = () => {
    if (swiperRef.current) {
      swiperRef.current.slideNext();
    }
  };

  const goToSlide = (index: number) => {
    if (swiperRef.current) {
      swiperRef.current.slideTo(index);
    }
  };

  if (loading) {
    return (
      <section className="relative h-[60vh] sm:h-[70vh] md:h-[80vh] lg:h-[85vh] text-white overflow-hidden bg-black">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 sm:h-32 sm:w-32 border-b-2 border-white"></div>
        </div>
      </section>
    );
  }

  // Fallback for no collections
  if (collections.length === 0) {
    return (
      <section className="relative h-[60vh] sm:h-[70vh] md:h-[80vh] lg:h-[85vh] text-white overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt="Default Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30"></div>
        </div>

        <div className="absolute bottom-8 sm:bottom-16 md:bottom-24 lg:bottom-32 left-4 right-4 sm:left-8 sm:right-8 flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6 lg:gap-0">
          <div className="flex flex-col justify-end">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl xl:text-9xl font-black leading-none tracking-tight">
              COMING
              <br />
              <span className="text-white/90">SOON</span>
            </h1>
          </div>

          <div className="flex flex-col justify-end space-y-4 sm:space-y-6 max-w-sm lg:text-right">
            <p className="text-base sm:text-lg font-light leading-relaxed">
              Our exclusive collections are being curated. Stay tuned for premium quality and exceptional style.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-[60vh] sm:h-[70vh] md:h-[80vh] lg:h-[85vh] overflow-hidden">
      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        spaceBetween={0}
        slidesPerView={1}
        autoplay={{
          delay: 6000,
          disableOnInteraction: false,
        }}
        speed={800}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        onSlideChange={handleSlideChange}
        className="h-full"
      >
        {collections.map((collection, index) => (
          <SwiperSlide key={collection.id}>
            <CollectionSlide
              collection={collection}
              isActive={index === activeIndex}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Navigation Controls */}
      {collections.length > 1 && (
        <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-4 right-4 sm:left-8 sm:right-8 flex flex-col sm:flex-row sm:justify-between items-center z-10 gap-4 sm:gap-0">
          {/* Dots Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex space-x-2 sm:space-x-3 order-2 sm:order-1"
          >
            {collections.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                  index === activeIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </motion.div>

          {/* Arrow Navigation */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex space-x-3 sm:space-x-4 order-1 sm:order-2"
          >
            <button
              onClick={goToPrev}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-black/20 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors group"
              aria-label="Previous slide"
            >
              <ArrowRight size={16} className="sm:w-5 sm:h-5 rotate-180 group-hover:scale-110 transition-transform" />
            </button>
            <button
              onClick={goToNext}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-white/90 border border-white rounded-full flex items-center justify-center hover:bg-white transition-colors group"
              aria-label="Next slide"
            >
              <ArrowRight size={16} className="sm:w-5 sm:h-5 text-black group-hover:scale-110 transition-transform" />
            </button>
          </motion.div>
        </div>
      )}
    </section>
  );
};

export default HeroSwiper;