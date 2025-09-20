import { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Grid3X3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchCollectionBySlug } from '../services/collectionsService';
import { CollectionWithProducts } from '../types/collection';
import ProductGrid from '../components/products/ProductGrid';
import Breadcrumb from '../components/ui/Breadcrumb';

const CollectionDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [collection, setCollection] = useState<CollectionWithProducts | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug) {
      loadCollection();
    }
  }, [slug]);

  const loadCollection = async () => {
    if (!slug) return;

    try {
      const data = await fetchCollectionBySlug(slug);
      if (data) {
        setCollection(data);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error('Error loading collection:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 w-1/3 mb-4"></div>
            <div className="h-6 bg-gray-200 w-2/3 mb-12"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-96 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !collection) {
    return <Navigate to="/collections" replace />;
  }

  // Transform collection products for ProductGrid
  const products = collection.collection_products?.map(item => ({
    id: item.products.id,
    title: item.products.title,
    price: item.products.price,
    brand: item.products.brands?.name,
    image: item.products.product_images?.[0]?.storage_path,
    images: item.products.product_images?.map(img => img.storage_path) || [],
    variants: item.products.product_variants?.filter(v => v.is_active !== false) || [],
    position: item.position
  })).sort((a, b) => a.position - b.position) || [];

  // Generate breadcrumb items
  const breadcrumbItems = [
    {
      label: 'Collections',
      path: '/collections',
      icon: <Grid3X3 size={16} />
    },
    {
      label: collection.name
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Breadcrumb items={breadcrumbItems} className="mb-6" />
      </div>

      {/* Hero Section */}
      <section
        className="relative h-[40vh] sm:h-[45vh] lg:h-[50vh] bg-black text-white overflow-hidden flex flex-col"
        style={{
          backgroundImage: collection.image_url ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/kixora/${collection.image_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full h-full flex flex-col justify-end py-6 sm:py-8 lg:py-12">
          {/* Title and Description - Bottom Left */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-tight mb-3 sm:mb-4 uppercase tracking-tight">
              {collection.name}
            </h1>

            {collection.description && (
              <p className="text-base sm:text-lg lg:text-xl text-white/90 leading-relaxed max-w-2xl">
                {collection.description}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {products.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <ProductGrid products={products} loading={false} />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 sm:py-12"
            >
              <div className="text-6xl mb-4">👟</div>
              <h3 className="text-2xl font-semibold text-black mb-4">No Products Yet</h3>
              <p className="text-gray-600 mb-8">This collection is being updated with new products. Check back soon!</p>
              <Link to="/products">
                <button className="inline-flex items-center px-6 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors">
                  <span>Browse All Products</span>
                  <ArrowRight size={16} className="ml-2" />
                </button>
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* Related Collections CTA */}
      <section className="py-8 sm:py-12 lg:py-16 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 lg:mb-6">
              Discover More Collections
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-6 sm:mb-8 leading-relaxed px-2">
              Explore our other curated collections for more premium footwear options.
            </p>
            <div className="flex flex-col gap-3 sm:gap-4 max-w-md mx-auto sm:max-w-none sm:flex-row sm:justify-center">
              <Link to="/collections" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-white text-black font-semibold hover:bg-gray-100 transition-colors text-sm sm:text-base min-h-[48px]">
                  <span>View All Collections</span>
                  <ArrowRight size={16} className="ml-2 sm:hidden" />
                  <ArrowRight size={20} className="ml-2 hidden sm:inline" />
                </button>
              </Link>
              <Link to="/products" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 border-2 border-white text-white font-semibold hover:bg-white hover:text-black transition-colors text-sm sm:text-base min-h-[48px]">
                  Browse Products
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default CollectionDetailPage;