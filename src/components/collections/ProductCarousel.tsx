import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import ProductCard from '../products/ProductCard';

interface Product {
  id: string;
  title: string;
  brand?: string;
  price: number;
  image?: string;
  images?: string[];
  rating?: number;
  reviewCount?: number;
  featured?: boolean;
  variants?: Array<{
    id: string;
    size: string;
    color: string;
    stock: number;
  }>;
}

interface ProductCarouselProps {
  products: Product[];
  title?: string;
}

const ProductCarousel = ({ products, title }: ProductCarouselProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(4);

  // Calculate cards per view based on screen size
  useEffect(() => {
    const updateCardsPerView = () => {
      const width = window.innerWidth;
      if (width < 640) setCardsPerView(2); // Mobile: show 2 cards to match grid
      else if (width < 768) setCardsPerView(2);
      else if (width < 1024) setCardsPerView(3);
      else if (width < 1440) setCardsPerView(4);
      else setCardsPerView(4); // Cap at 4 for large screens
    };

    updateCardsPerView();
    window.addEventListener('resize', updateCardsPerView);
    return () => window.removeEventListener('resize', updateCardsPerView);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.clientWidth;
      // Scroll by container width to show next set of cards
      const scrollAmount = containerWidth * 0.8;
      const newScrollLeft = scrollContainerRef.current.scrollLeft +
        (direction === 'right' ? scrollAmount : -scrollAmount);

      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  // Mobile pagination functionality
  const scrollToIndex = (index: number) => {
    if (scrollContainerRef.current) {
      const containerWidth = scrollContainerRef.current.clientWidth;
      const scrollAmount = containerWidth * 0.9; // Scroll almost full width
      const newScrollLeft = index * scrollAmount;

      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  // Update current index for mobile pagination
  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current && window.innerWidth < 768) {
        const containerWidth = scrollContainerRef.current.clientWidth;
        const scrollAmount = containerWidth * 0.9;
        const newIndex = Math.round(scrollContainerRef.current.scrollLeft / scrollAmount);
        setCurrentIndex(newIndex);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const canScrollLeft = () => {
    return scrollContainerRef.current?.scrollLeft ?? 0 > 0;
  };

  const canScrollRight = () => {
    if (!scrollContainerRef.current) return false;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    return scrollLeft < scrollWidth - clientWidth - 10; // 10px buffer
  };

  const totalPages = Math.max(1, Math.ceil(products.length / 2)); // For mobile pagination

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {title && (
        <h3 className="text-2xl font-bold text-black mb-6">{title}</h3>
      )}

      {/* Desktop Navigation Arrows */}
      <div className="hidden md:block">
        <button
          onClick={() => scroll('left')}
          className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white shadow-lg border border-gray-200 rounded-full flex items-center justify-center transition-all duration-200 ${
            canScrollLeft()
              ? 'text-black hover:bg-gray-50 hover:shadow-xl'
              : 'text-gray-300 cursor-not-allowed'
          }`}
          disabled={!canScrollLeft()}
        >
          <ChevronLeft size={20} />
        </button>

        <button
          onClick={() => scroll('right')}
          className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white shadow-lg border border-gray-200 rounded-full flex items-center justify-center transition-all duration-200 ${
            canScrollRight()
              ? 'text-black hover:bg-gray-50 hover:shadow-xl'
              : 'text-gray-300 cursor-not-allowed'
          }`}
          disabled={!canScrollRight()}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Product Carousel */}
      <div
        ref={scrollContainerRef}
        className="flex gap-3 md:gap-6 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="flex-none w-[calc(50%-6px)] sm:w-[calc(50%-8px)] md:w-[calc(33.333%-12px)] lg:w-[calc(25%-18px)] min-w-[160px] max-w-[320px]"
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </div>

      {/* Mobile scroll indicator dots */}
      <div className="flex justify-center mt-4 sm:mt-6 md:hidden">
        <div className="flex space-x-2">
          {Array.from({ length: totalPages }).map((_, index) => {
            const isActive = currentIndex === index;
            return (
              <button
                key={index}
                onClick={() => scrollToIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-black w-6'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to page ${index + 1}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProductCarousel;