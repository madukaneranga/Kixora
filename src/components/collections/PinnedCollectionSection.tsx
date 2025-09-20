import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import ProductCard from '../products/ProductCard';
import Button from '../ui/Button';

interface PinnedCollection {
  id: string;
  slug: string;
  name: string;
  description?: string;
  image_url?: string;
  products: Array<{
    id: string;
    title: string;
    brand?: string;
    price: number;
    image?: string;
    rating?: number;
    reviewCount?: number;
    featured?: boolean;
    variants?: Array<{
      id: string;
      size: string;
      color: string;
      stock: number;
    }>;
  }>;
}

interface PinnedCollectionSectionProps {
  collection: PinnedCollection;
}

const PinnedCollectionSection = ({ collection }: PinnedCollectionSectionProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  if (!collection || !collection.products || collection.products.length === 0) {
    return null;
  }

  // Check scroll position
  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      window.addEventListener('resize', updateScrollButtons);
      return () => {
        container.removeEventListener('scroll', updateScrollButtons);
        window.removeEventListener('resize', updateScrollButtons);
      };
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.clientWidth;
      const scrollAmount = containerWidth * 0.8;
      const newScrollLeft = scrollContainerRef.current.scrollLeft +
        (direction === 'right' ? scrollAmount : -scrollAmount);

      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="py-8 sm:py-10 bg-white">
      <div className="w-full"> 
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-4 sm:mb-6 px-6 sm:px-8 lg:px-10"
        >
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-black"
          >
            {collection.name}
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex-shrink-0"
          >
            <Link to={`/collections/${collection.slug}`}>
              <Button
                variant="outline"
                className="flex items-center space-x-1 sm:space-x-2 hover:bg-black hover:text-white transition-colors duration-300 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              >
                <span className="hidden sm:inline">View Collection</span>
                <span className="sm:hidden">View</span>
                <ArrowRight size={14} className="sm:hidden" />
                <ArrowRight size={16} className="hidden sm:inline" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Products Carousel with Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative w-full"
        >
          {/* Navigation Buttons */}
          <div className="hidden md:block">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white shadow-lg border border-gray-200 rounded-full flex items-center justify-center transition-all duration-200 ${
                canScrollLeft
                  ? 'text-black hover:bg-gray-50 hover:shadow-xl'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
            >
              <ChevronLeft size={20} />
            </button>

            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white shadow-lg border border-gray-200 rounded-full flex items-center justify-center transition-all duration-200 ${
                canScrollRight
                  ? 'text-black hover:bg-gray-50 hover:shadow-xl'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Mobile: Double Row, Desktop: Single Row */}
          <div
            ref={scrollContainerRef}
            className="overflow-x-auto scrollbar-hide pb-4 scroll-smooth px-4 sm:px-6 lg:px-8"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {/* Mobile Double Row Grid */}
            <div className="grid grid-rows-2 grid-flow-col gap-3 auto-cols-[minmax(160px,180px)] sm:hidden">
              {collection.products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="w-full"
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>

            {/* Desktop Single Row Flex */}
            <div className="hidden sm:flex gap-3 md:gap-6">
              {collection.products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex-none w-[calc(50%-8px)] md:w-[calc(33.333%-12px)] lg:w-[calc(25%-18px)] min-w-[180px] max-w-[280px]"
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mobile scroll indicator dots */}
          <div className="flex justify-center mt-4 sm:hidden px-4">
            <div className="flex space-x-2">
              {Array.from({ length: Math.ceil(collection.products.length / 4) }).map((_, index) => (
                <div
                  key={index}
                  className="w-2 h-2 bg-gray-300 rounded-full"
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PinnedCollectionSection;