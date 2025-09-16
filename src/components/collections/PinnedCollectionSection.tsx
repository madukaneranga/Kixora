import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import ProductCarousel from './ProductCarousel';
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
  if (!collection || !collection.products || collection.products.length === 0) {
    return null;
  }

  return (
    <section className="py-12 sm:py-16 bg-white">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-end lg:justify-between mb-6 sm:mb-8"
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
                Featured Collection
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-3xl sm:text-4xl font-bold text-black mb-4"
            >
              {collection.name}
            </motion.h2>

            {collection.description && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-lg text-gray-600 max-w-2xl leading-relaxed"
              >
                {collection.description}
              </motion.p>
            )}
          </div>

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
                className="flex items-center space-x-2 hover:bg-black hover:text-white transition-colors duration-300"
              >
                <span>View Collection</span>
                <ArrowRight size={16} />
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
        >
          <ProductCarousel products={collection.products} />
        </motion.div>
      </div>
    </section>
  );
};

export default PinnedCollectionSection;