import { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchCollectionBySlug } from '../services/collectionsService';
import { CollectionWithProducts } from '../types/collection';
import ProductGrid from '../components/products/ProductGrid';

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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
    variants: item.products.product_variants || [],
    position: item.position
  })).sort((a, b) => a.position - b.position) || [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section
        className="relative py-24 bg-black text-white overflow-hidden"
        style={{
          backgroundImage: collection.image_url ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${collection.image_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* Back Button */}
            <Link
              to="/collections"
              className="inline-flex items-center text-white/80 hover:text-white transition-colors mb-8 group"
            >
              <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Collections
            </Link>

            <h1 className="text-5xl lg:text-7xl font-black leading-tight mb-6 uppercase">
              {collection.name}
            </h1>

            {collection.description && (
              <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
                {collection.description}
              </p>
            )}

            <div className="mt-8">
              <p className="text-lg text-white/70">
                {products.length} {products.length === 1 ? 'Product' : 'Products'}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-20">
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
              className="text-center py-16"
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
      <section className="py-20 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-6">
              Discover More Collections
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Explore our other curated collections for more premium footwear options.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/collections">
                <button className="inline-flex items-center px-8 py-4 bg-white text-black font-semibold hover:bg-gray-100 transition-colors">
                  <span>View All Collections</span>
                  <ArrowRight size={20} className="ml-2" />
                </button>
              </Link>
              <Link to="/products">
                <button className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold hover:bg-white hover:text-black transition-colors">
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