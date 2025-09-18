import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from './ProductCard';

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

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
}

const ProductGrid = ({ products, loading = false }: ProductGridProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-slate-200 aspect-[4/5] rounded-lg mb-4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-slate-200 rounded"></div>
              <div className="h-3 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="text-6xl mb-4">👟</div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">No products found</h3>
        <p className="text-slate-600 max-w-md mx-auto">Try adjusting your search or filter criteria</p>
      </div>
    );
  }

  return (
    <motion.div
      layout
      className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6"
    >
      <AnimatePresence>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProductGrid;