import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import ProductCard from '../products/ProductCard';

interface Product {
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
}

interface ProductCarouselProps {
  products: Product[];
  title?: string;
}

const ProductCarousel = ({ products, title }: ProductCarouselProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320; // Width of one product card + gap
      const newScrollLeft = scrollContainerRef.current.scrollLeft +
        (direction === 'right' ? scrollAmount : -scrollAmount);

      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const canScrollLeft = () => {
    return scrollContainerRef.current?.scrollLeft ?? 0 > 0;
  };

  const canScrollRight = () => {
    if (!scrollContainerRef.current) return false;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    return scrollLeft < scrollWidth - clientWidth - 10; // 10px buffer
  };

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
        className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitScrollbar: { display: 'none' }
        }}
      >
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="flex-none"
            style={{
              width: 'calc(25% - 18px)',
              minWidth: '280px'
            }}
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </div>

      {/* Mobile scroll indicator dots */}
      <div className="flex justify-center mt-6 md:hidden">
        <div className="flex space-x-2">
          {Array.from({ length: Math.ceil(products.length / 2) }).map((_, index) => (
            <div
              key={index}
              className="w-2 h-2 bg-gray-300 rounded-full"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductCarousel;