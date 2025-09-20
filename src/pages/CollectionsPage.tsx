import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Grid3X3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchAllCollections } from '../services/collectionsService';
import { Collection } from '../types/collection';
import Breadcrumb from '../components/ui/Breadcrumb';

const CollectionsPage = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const data = await fetchAllCollections();
      setCollections(data);
    } catch (error) {
      console.error('Error fetching collections:', error);
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-200"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    {
      label: 'Collections',
      icon: <Grid3X3 size={16} />
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Section */}
      <section className="py-8 sm:py-12 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <Breadcrumb items={breadcrumbItems} className="mb-6" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black mb-4 sm:mb-6">
              Our Collections
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover our curated collections of premium footwear. From athletic performance to everyday style,
              find the perfect shoes for every occasion and lifestyle.
            </p>
          </motion.div>

          {/* Collections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {collections.map((collection, index) => (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 h-80"
              >
                <Link to={`/collections/${collection.slug}`}>
                  <div className="relative h-full overflow-hidden">
                    <img
                      src={collection.image_url ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/kixora/${collection.image_url}` : 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=600'}
                      alt={collection.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-50 transition-all duration-300"></div>
                    <div className="absolute bottom-0 left-0 p-6">
                      <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                        {collection.name}
                      </h3>
                      {collection.description && (
                        <p className="text-white text-sm mb-4 opacity-90 line-clamp-2">
                          {collection.description}
                        </p>
                      )}
                      <div className="flex items-center justify-center text-white bg-white bg-opacity-20 px-6 py-3 backdrop-blur-sm hover:bg-opacity-30 transition-all duration-300 w-40">
                        <span className="font-medium">Shop Now</span>
                        <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Empty State */}
          {collections.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 sm:py-12"
            >
              <div className="text-6xl mb-4">👟</div>
              <h3 className="text-2xl font-semibold text-black mb-4">No Collections Available</h3>
              <p className="text-gray-600 mb-8">Our collections are being updated. Check back soon!</p>
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

      {/* Call to Action Section */}
      {collections.length > 0 && (
        <section className="py-8 sm:py-12 lg:py-16 bg-black text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">
                Can't Find What You're Looking For?
              </h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Browse our complete product catalog or get in touch with our team for personalized recommendations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/products">
                  <button className="inline-flex items-center px-8 py-4 bg-white text-black font-semibold hover:bg-gray-100 transition-colors">
                    <span>View All Products</span>
                    <ArrowRight size={20} className="ml-2" />
                  </button>
                </Link>
                <button className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold hover:bg-white hover:text-black transition-colors">
                  Contact Us
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  );
};

export default CollectionsPage;