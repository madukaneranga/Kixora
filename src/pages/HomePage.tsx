import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import ProductCard from '../components/products/ProductCard';
import Button from '../components/ui/Button';
import HeroSwiper from '../components/ui/HeroSwiper';
import MiddleBanner from '../components/ui/MiddleBanner';
import CategoryTiles from '../components/ui/CategoryTiles';
import PinnedCollectionSection from '../components/collections/PinnedCollectionSection';
import { fetchPinnedCollection } from '../services/collectionsService';
import middleBannerImage from '../assests/Middle_Banner.png';
import SEOHead from '../components/seo/SEOHead';
import { generateSEOData } from '../hooks/useSEO';
import { organizationSchema, websiteSchema } from '../utils/structuredData';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [pinnedCollection, setPinnedCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pinnedLoading, setPinnedLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
    fetchPinnedCollectionData();
  }, []);

  // Check scroll position for products carousel
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
  }, [featuredProducts]);

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

  const fetchPinnedCollectionData = async () => {
    try {
      const data = await fetchPinnedCollection();
      setPinnedCollection(data);
    } catch (error) {
      console.error('Error fetching pinned collection:', error);
    } finally {
      setPinnedLoading(false);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          title,
          slug,
          price,
          featured,
          brands (
            slug,
            name
          ),
          product_images (
            storage_path
          ),
          product_variants (
            id,
            size,
            color,
            stock,
            is_active
          )
        `)
        .eq('featured', true)
        .eq('is_active', true)
        .is('deleted_at', null)
        .limit(8);

      if (error) throw error;

      const products = data?.map(product => ({
        id: product.id,
        title: product.title,
        brand: product.brands?.name,
        price: product.price,
        featured: product.featured,
        image: product.product_images?.[0]?.storage_path,
        images: product.product_images?.map(img => img.storage_path) || [],
        variants: product.product_variants?.filter(v => v.is_active !== false) || []
      })) || [];

      setFeaturedProducts(products);
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        seoData={generateSEOData.home()}
        structuredData={[
          { schema: organizationSchema, id: 'organization-schema' },
          { schema: websiteSchema, id: 'website-schema' }
        ]}
      />
      <div className="min-h-screen">
        {/* Hero Section - Dynamic Collections Swiper */}
        <HeroSwiper />

      {/* Pinned Collection Section */}
      {pinnedCollection && !pinnedLoading && (
        <PinnedCollectionSection collection={pinnedCollection} />
      )}

      {/* Category Tiles Section */}
      <CategoryTiles />

      {/* Featured Products Section */}
      <section className="py-8 sm:py-10 bg-white">
        <div className="w-full">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-between mb-4 sm:mb-6 px-6 sm:pl-12 sm:pr-8 lg:pl-16 lg:pr-10"
          >
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-black sm:ml-8 lg:ml-10"
            >
              Popular Picks
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-center gap-3"
            >
              {/* Navigation Buttons */}
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => scroll('left')}
                  disabled={!canScrollLeft}
                  className={`w-10 h-10 bg-white shadow-md border border-gray-200 rounded-full flex items-center justify-center transition-all duration-200 ${
                    canScrollLeft
                      ? 'text-black hover:bg-gray-50 hover:shadow-lg'
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <ChevronLeft size={18} />
                </button>

                <button
                  onClick={() => scroll('right')}
                  disabled={!canScrollRight}
                  className={`w-10 h-10 bg-white shadow-md border border-gray-200 rounded-full flex items-center justify-center transition-all duration-200 ${
                    canScrollRight
                      ? 'text-black hover:bg-gray-50 hover:shadow-lg'
                      : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* View All Button */}
              <Link to="/products">
                <Button
                  variant="outline"
                  className="flex items-center space-x-1 sm:space-x-2 hover:bg-black hover:text-white transition-colors duration-300 text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
                >
                  <span className="hidden sm:inline">View All Products</span>
                  <span className="sm:hidden">View All</span>
                  <ArrowRight size={14} className="sm:hidden" />
                  <ArrowRight size={16} className="hidden sm:inline" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Products Carousel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative w-full"
          >

            {/* Products Carousel */}
            {loading ? (
              <div className="flex gap-3 md:gap-6 overflow-x-auto scrollbar-hide pb-4 px-4 sm:pl-20 sm:pr-6 lg:pl-26 lg:pr-8">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex-none w-[calc(50%-6px)] sm:w-[calc(50%-8px)] md:w-[calc(33.333%-12px)] lg:w-[calc(25%-18px)] min-w-[160px] max-w-[320px] aspect-[3/4] bg-gray-200 animate-pulse rounded-lg"
                  />
                ))}
              </div>
            ) : (
              <div
                ref={scrollContainerRef}
                className="flex gap-3 md:gap-6 overflow-x-auto scrollbar-hide pb-4 scroll-smooth px-4 sm:pl-20 sm:pr-6 lg:pl-26 lg:pr-8"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              >
                {featuredProducts.map((product, index) => (
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
            )}

            {/* Mobile scroll indicator dots */}
            {!loading && featuredProducts.length > 0 && (
              <div className="flex justify-center mt-4 sm:mt-6 md:hidden px-4">
                <div className="flex space-x-2">
                  {Array.from({ length: Math.ceil(featuredProducts.length / 2) }).map((_, index) => (
                    <div
                      key={index}
                      className="w-2 h-2 bg-gray-300 rounded-full"
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Middle Banner Section */}
      <MiddleBanner
        image={middleBannerImage}
        title="Step Into"
        subtitle="Excellence"
      />

      </div>
    </>
  );
};

export default HomePage;