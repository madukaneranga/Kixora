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
      <section className="py-8 sm:py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-4 sm:mb-6"
          >
            <div className="mb-4 lg:mb-0">


              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl sm:text-2xl md:text-3xl font-bold text-black mb-3"
              >
                Popular Picks
              </motion.h2>
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