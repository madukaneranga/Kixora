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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-slate-200 aspect-square rounded-2xl mb-4"></div>
            <div className="h-4 bg-slate-200 rounded mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-2/3 mb-2"></div>
            <div className="h-6 bg-slate-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">👟</div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">No products found</h3>
        <p className="text-slate-600">Try adjusting your search or filter criteria</p>
      </div>
    );
  }

  return (
    <motion.div
      layout
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
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