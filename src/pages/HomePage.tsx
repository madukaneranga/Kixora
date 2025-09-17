import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import ProductGrid from '../components/products/ProductGrid';
import Button from '../components/ui/Button';
import HeroSwiper from '../components/ui/HeroSwiper';
import MiddleBanner from '../components/ui/MiddleBanner';
import CategoryTiles from '../components/ui/CategoryTiles';
import PinnedCollectionSection from '../components/collections/PinnedCollectionSection';
import { fetchPinnedCollection } from '../services/collectionsService';
import middleBannerImage from '../assests/Middle_Banner.png';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [pinnedCollection, setPinnedCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pinnedLoading, setPinnedLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
    fetchPinnedCollectionData();
  }, []);

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
            stock
          )
        `)
        .eq('featured', true)
        .eq('is_active', true)
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
        variants: product.product_variants || []
      })) || [];

      setFeaturedProducts(products);
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section - Dynamic Collections Swiper */}
      <HeroSwiper />

      {/* Pinned Collection Section */}
      {pinnedCollection && !pinnedLoading && (
        <PinnedCollectionSection collection={pinnedCollection} />
      )}

      {/* Featured Products Section */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-6 sm:mb-8"
          >
            <div className="mb-6 lg:mb-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="flex items-center space-x-2 mb-2"
              >
                <div className="w-8 h-0.5 bg-black"></div>
                <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Featured Products
                </span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-3xl sm:text-4xl font-bold text-black mb-4"
              >
                Popular Picks
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-lg text-gray-600 max-w-2xl leading-relaxed"
              >
                Discover our most popular and highly-rated athletic footwear
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex-shrink-0"
            >
              <Link to="/products">
                <Button
                  variant="outline"
                  className="flex items-center space-x-2 hover:bg-black hover:text-white transition-colors duration-300"
                >
                  <span>View All Products</span>
                  <ArrowRight size={16} />
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Products Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <ProductGrid products={featuredProducts} loading={loading} />
          </motion.div>
        </div>
      </section>

      {/* Category Tiles Section */}
      <CategoryTiles />

      {/* Middle Banner Section */}
      <MiddleBanner
        image={middleBannerImage}
        title="Step Into"
        subtitle="Excellence"
      />

    </div>
  );
};

export default HomePage;