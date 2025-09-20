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
import { SlidersHorizontal, ChevronUp, ChevronDown, Package } from 'lucide-react';

import { supabase } from '../lib/supabase';
import ProductGrid from '../components/products/ProductGrid';
import FiltersSidebar from '../components/products/FiltersSidebar';
import Button from '../components/ui/Button';
import Breadcrumb from '../components/ui/Breadcrumb';

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
  images?: string[];
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
const PRODUCTS_PER_PAGE = 12;

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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

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

  const fetchProducts = useCallback(async (page = 1, loadMore = false) => {
    if (loadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setCurrentPage(1);
      setHasMore(true);
    }

    try {
      // Get simple product count (no complex joins needed)
      let countQuery = supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true)
        .is('deleted_at', null);

      // Apply basic filters for count (skip color filtering as it's client-side)
      if (selectedCategory) {
        // Join with categories for filtering
        countQuery = supabase
          .from('products')
          .select(`
            id,
            categories!inner (slug)
          `, { count: 'exact', head: true })
          .eq('is_active', true)
          .is('deleted_at', null)
          .eq('categories.slug', selectedCategory);
      }

      if (priceRange.min) {
        countQuery = countQuery.gte('price', parseFloat(priceRange.min));
      }
      if (priceRange.max) {
        countQuery = countQuery.lte('price', parseFloat(priceRange.max));
      }
      if (searchQuery) {
        countQuery = countQuery.ilike('title', `%${searchQuery}%`);
      }

      const { count } = await countQuery;
      setTotalCount(count || 0);

      // Then get the actual products with pagination
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
            stock,
            is_active
          )
        `)
        .eq('is_active', true)
        .is('deleted_at', null);

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

      // Add pagination
      const from = (page - 1) * PRODUCTS_PER_PAGE;
      const to = from + PRODUCTS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error } = await query;
      if (error) throw error;

      let fetchedProducts = data?.map(product => ({
        id: product.id,
        title: product.title,
        brand: product.brands?.name,
        price: product.price,
        featured: product.featured,
        category: product.categories?.name || '',
        image: product.product_images?.[0]?.storage_path,
        images: product.product_images?.map(img => img.storage_path) || [],
        variants: product.product_variants?.filter(v => v.is_active !== false) || []
      })) || [];

      // Client-side filtering for colors (apply to fetched products only)
      if (selectedColors.length > 0) {
        fetchedProducts = fetchedProducts.filter(product =>
          product.variants?.some(variant =>
            selectedColors.includes(variant.color)
          )
        );
      }

      if (loadMore) {
        setProducts(prev => [...prev, ...fetchedProducts]);
        setCurrentPage(page);
      } else {
        setProducts(fetchedProducts);
      }

      // Check if there are more products to load
      const loadedCount = loadMore ? products.length + fetchedProducts.length : fetchedProducts.length;
      setHasMore(fetchedProducts.length === PRODUCTS_PER_PAGE);

    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedCategory, priceRange, selectedColors, sortBy, searchQuery, products.length]);

  // Load more products function
  const loadMoreProducts = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchProducts(currentPage + 1, true);
    }
  }, [fetchProducts, currentPage, loadingMore, hasMore]);

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
        loadMoreProducts();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMoreProducts]);

  // Effects
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Computed values
  const activeFilterCount = getActiveFilterCount();


  // Generate breadcrumb items
  const breadcrumbItems = [
    {
      label: 'Products',
      path: selectedCategory ? '/products' : undefined,
      icon: <Package size={16} />
    },
    ...(selectedCategory ? [{
      label: categories.find(c => c.slug === selectedCategory)?.name || selectedCategory
    }] : []),
    ...(searchQuery ? [{
      label: `Search: "${searchQuery}"`
    }] : [])
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} className="mb-4" />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 space-y-3 lg:space-y-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">
            {selectedCategory ? categories.find(c => c.slug === selectedCategory)?.name : 'All Products'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {loading ? 'Loading...' : `${products.length} products found`}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => setShowFilters(true)}
            className="flex items-center space-x-2 h-10"
          >
            <SlidersHorizontal size={16} />
            <span>Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
          </Button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 h-10"
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

        {/* Loading more indicator */}
        {loadingMore && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-3 text-gray-600">Loading more products...</span>
          </div>
        )}

        {/* End of results message */}
        {!loading && !loadingMore && !hasMore && products.length > 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>You've reached the end of our product catalog!</p>
            <p className="text-sm mt-1">Showing all {products.length} products</p>
          </div>
        )}

        {/* No products message */}
        {!loading && !loadingMore && products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
            <Button
              variant="outline"
              onClick={clearFilters}
              className="mt-4 h-10"
            >
              Clear all filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;