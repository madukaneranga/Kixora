/**
 * ProductsPage - Main product listing page with advanced filtering and sorting
 *
 * Features:
 * - Expandable filter sections (Category, Price, Color)
 * - Real-time search functionality
 * - Multiple sort options
 * - Responsive design with mobile filter drawer
 * - Optimized performance with memoized functions and React.memo
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, ChevronUp, ChevronDown } from 'lucide-react';

import { supabase } from '../lib/supabase';
import ProductGrid from '../components/products/ProductGrid';
import FiltersSidebar from '../components/products/FiltersSidebar';
import Button from '../components/ui/Button';

// Types
interface ProductVariant {
  id: string;
  size: string;
  color: string;
  stock: number;
}

interface Product {
  id: string;
  title: string;
  brand?: string;
  price: number;
  category: string;
  image?: string;
  rating?: number;
  reviewCount?: number;
  featured?: boolean;
  variants?: ProductVariant[];
}

interface Category {
  id: string;
  slug: string;
  name: string;
}

interface PriceRange {
  min: string;
  max: string;
}

// Constants
const AVAILABLE_COLORS = ['Black', 'White', 'Red', 'Blue', 'Grey', 'Navy', 'Beige'];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A to Z' }
];

// Expandable section component - moved outside to prevent re-renders
const ExpandableSection = React.memo(({
  isExpanded,
  onToggle,
  title,
  activeCount,
  children
}: {
  isExpanded: boolean;
  onToggle: () => void;
  title: string;
  activeCount?: number;
  children: React.ReactNode;
}) => {
  const ChevronIcon = isExpanded ? ChevronUp : ChevronDown;

  return (
    <div className="border-b border-gray-200 pb-4">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full py-2 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-slate-700">{title}</span>
          {activeCount > 0 && (
            <span className="bg-orange-500 text-white text-xs px-2 py-1 font-medium">
              {activeCount}
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronIcon size={16} className="text-gray-500" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

ExpandableSection.displayName = 'ExpandableSection';

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // UI states
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: '', max: '' });
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  // Helper functions
  const getActiveFilterCount = useCallback(() => {
    return [
      selectedCategory,
      priceRange.min,
      priceRange.max,
      ...selectedColors,
    ].filter(Boolean).length;
  }, [selectedCategory, priceRange, selectedColors]);


  const handleColorToggle = useCallback((color: string) => {
    setSelectedColors(prev =>
      prev.includes(color)
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
    setSelectedColors([]);
    setSearchQuery('');
    setSearchParams({});
  }, [setSearchParams]);


  // Data fetching
  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, slug, name')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select(`
          id,
          title,
          price,
          featured,
          categories (
            slug,
            name
          ),
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
        .eq('is_active', true);

      // Apply filters
      if (selectedCategory) {
        query = query.eq('categories.slug', selectedCategory);
      }

      if (priceRange.min) {
        query = query.gte('price', parseFloat(priceRange.min));
      }
      if (priceRange.max) {
        query = query.lte('price', parseFloat(priceRange.max));
      }

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      // Apply sorting
      switch (sortBy) {
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        case 'name':
          query = query.order('title', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      let filteredProducts = data?.map(product => ({
        id: product.id,
        title: product.title,
        brand: product.brands?.name,
        price: product.price,
        featured: product.featured,
        category: product.categories?.name || '',
        image: product.product_images?.[0]?.storage_path,
        variants: product.product_variants || []
      })) || [];

      // Client-side filtering for colors
      if (selectedColors.length > 0) {
        filteredProducts = filteredProducts.filter(product =>
          product.variants?.some(variant =>
            selectedColors.includes(variant.color)
          )
        );
      }

      setProducts(filteredProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, priceRange, selectedColors, sortBy, searchQuery]);

  // Effects
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Computed values
  const activeFilterCount = getActiveFilterCount();


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {selectedCategory ? categories.find(c => c.slug === selectedCategory)?.name : 'All Products'}
          </h1>
          <p className="text-slate-600 mt-2">
            {loading ? 'Loading...' : `${products.length} products found`}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => setShowFilters(true)}
            className="flex items-center space-x-2"
          >
            <SlidersHorizontal size={16} />
            <span>Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
          </Button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filters Sidebar */}
      <FiltersSidebar
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        selectedColors={selectedColors}
        handleColorToggle={handleColorToggle}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        clearFilters={clearFilters}
        activeFilterCount={activeFilterCount}
      />

      {/* Products Grid */}
      <div className="w-full">
        <ProductGrid products={products} loading={loading} />
      </div>
    </div>
  );
};

export default ProductsPage;