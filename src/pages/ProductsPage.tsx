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

import React, { useCallback, useEffect, useState, useMemo } from 'react';
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
  const [error, setError] = useState<string | null>(null);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // UI states
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [priceRange, setPriceRange] = useState<PriceRange>({
    min: searchParams.get('minPrice') || '',
    max: searchParams.get('maxPrice') || ''
  });
  const [selectedColors, setSelectedColors] = useState<string[]>(
    searchParams.get('colors')?.split(',').filter(Boolean) || []
  );
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  // Helper functions
  const updateSearchParams = useCallback((updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value && value.trim()) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });

    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const getActiveFilterCount = useCallback(() => {
    return [
      selectedCategory,
      priceRange.min,
      priceRange.max,
      ...selectedColors,
    ].filter(Boolean).length;
  }, [selectedCategory, priceRange, selectedColors]);


  const handleColorToggle = useCallback((color: string) => {
    const newColors = selectedColors.includes(color)
      ? selectedColors.filter(c => c !== color)
      : [...selectedColors, color];

    setSelectedColors(newColors);
    updateSearchParams({
      colors: newColors.length > 0 ? newColors.join(',') : null
    });
  }, [selectedColors, updateSearchParams]);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
    updateSearchParams({ category: category || null });
  }, [updateSearchParams]);

  const handlePriceChange = useCallback((newPriceRange: PriceRange) => {
    setPriceRange(newPriceRange);
    updateSearchParams({
      minPrice: newPriceRange.min || null,
      maxPrice: newPriceRange.max || null
    });
  }, [updateSearchParams]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    updateSearchParams({ search: query || null });
  }, [updateSearchParams]);

  const handleSortChange = useCallback((sort: string) => {
    setSortBy(sort);
    updateSearchParams({ sort: sort !== 'newest' ? sort : null });
  }, [updateSearchParams]);

  const clearFilters = useCallback(() => {
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
    setSelectedColors([]);
    setSearchQuery('');
    setSortBy('newest');
    setSearchParams({});
  }, [setSearchParams]);


  // Data fetching
  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesError(null);
      const { data, error } = await supabase
        .from('categories')
        .select('id, slug, name')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategoriesError('Failed to load categories. Please try again.');
      setCategories([]);
    }
  }, []);

  const fetchProducts = useCallback(async (page = 1, loadMore = false) => {
    if (loadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setCurrentPage(1);
      setHasMore(true);
      setError(null);
    }

    try {
      // Build the main query with conditional category join
      const categoryJoin = selectedCategory ? 'categories!inner' : 'categories';

      let query = supabase
        .from('products')
        .select(`
          id,
          title,
          slug,
          price,
          featured,
          ${categoryJoin} (
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

      // Get all data first for filtering
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

      // Apply color filtering client-side
      if (selectedColors.length > 0) {
        fetchedProducts = fetchedProducts.filter(product =>
          product.variants?.some(variant =>
            selectedColors.some(selectedColor =>
              variant.color && variant.color.toLowerCase() === selectedColor.toLowerCase()
            )
          )
        );
      }

      // Apply pagination to filtered results
      const totalFilteredCount = fetchedProducts.length;
      const from = (page - 1) * PRODUCTS_PER_PAGE;
      const to = from + PRODUCTS_PER_PAGE;
      const paginatedProducts = fetchedProducts.slice(from, to);

      setTotalCount(totalFilteredCount);

      if (loadMore) {
        setProducts(prev => [...prev, ...paginatedProducts]);
        setCurrentPage(page);
      } else {
        setProducts(paginatedProducts);
      }

      // Check if there are more products to load
      setHasMore(to < totalFilteredCount);

    } catch (error) {
      console.error('Error fetching products:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load products. Please try again.';
      setError(errorMessage);

      if (!loadMore) {
        setProducts([]);
        setTotalCount(0);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [selectedCategory, priceRange, selectedColors, sortBy, searchQuery]);

  // Load more products function
  const loadMoreProducts = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchProducts(currentPage + 1, true);
    }
  }, [currentPage, loadingMore, hasMore, fetchProducts]);

  // Infinite scroll effect with throttling
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      // Clear previous timeout
      clearTimeout(timeoutId);

      // Throttle scroll events
      timeoutId = setTimeout(() => {
        if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
          loadMoreProducts();
        }
      }, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [loadMoreProducts]);

  // Effect to handle URL parameter changes
  useEffect(() => {
    const category = searchParams.get('category') || '';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';
    const colors = searchParams.get('colors')?.split(',').filter(Boolean) || [];
    const sort = searchParams.get('sort') || 'newest';
    const search = searchParams.get('search') || '';

    // Update state if URL params differ from current state
    if (category !== selectedCategory) setSelectedCategory(category);
    if (minPrice !== priceRange.min || maxPrice !== priceRange.max) {
      setPriceRange({ min: minPrice, max: maxPrice });
    }
    if (JSON.stringify(colors) !== JSON.stringify(selectedColors)) {
      setSelectedColors(colors);
    }
    if (sort !== sortBy) setSortBy(sort);
    if (search !== searchQuery) setSearchQuery(search);
  }, [searchParams]);

  // Effects
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Debounced effect for fetching products
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts();
    }, 300); // 300ms debounce for search

    return () => clearTimeout(timeoutId);
  }, [selectedCategory, priceRange, selectedColors, sortBy, searchQuery]);

  // Computed values
  const activeFilterCount = useMemo(() => getActiveFilterCount(), [selectedCategory, priceRange, selectedColors]);

  // Generate breadcrumb items
  const breadcrumbItems = useMemo(() => [
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
  ], [selectedCategory, categories, searchQuery]);

  // Memoized current category name
  const currentCategoryName = useMemo(() => {
    return selectedCategory ? categories.find(c => c.slug === selectedCategory)?.name : 'All Products';
  }, [selectedCategory, categories]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} className="mb-4" />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 space-y-3 lg:space-y-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">
            {currentCategoryName}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {loading ? 'Loading...' : error ? 'Error loading products' : `${products.length} products found`}
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
            onChange={(e) => handleSortChange(e.target.value)}
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
        setSelectedCategory={handleCategoryChange}
        priceRange={priceRange}
        setPriceRange={handlePriceChange}
        selectedColors={selectedColors}
        handleColorToggle={handleColorToggle}
        searchQuery={searchQuery}
        setSearchQuery={handleSearchChange}
        clearFilters={clearFilters}
        activeFilterCount={activeFilterCount}
      />

      {/* Products Grid */}
      <div className="w-full">
        {/* Error Message */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-500 text-sm font-medium">
                {error}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setError(null);
                  fetchProducts();
                }}
                className="ml-auto text-red-600 hover:text-red-700"
              >
                Retry
              </Button>
            </div>
          </div>
        )}

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