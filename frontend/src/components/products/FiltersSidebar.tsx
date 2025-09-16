import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import ColorSelector from '../ui/ColorSelector';
import { getAvailableColors } from '../../services/colorService';

interface Category {
  id: string;
  slug: string;
  name: string;
}

interface PriceRange {
  min: string;
  max: string;
}

interface FiltersSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  priceRange: PriceRange;
  setPriceRange: (priceRange: PriceRange) => void;
  selectedColors: string[];
  handleColorToggle: (color: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;
  activeFilterCount: number;
}

// Get available colors from color service
const AVAILABLE_COLORS = getAvailableColors().map(color => color.name);

const ExpandableSection = ({ isExpanded, onToggle, title, activeCount, children }: {
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
          <span className="text-sm font-medium text-gray-700">{title}</span>
          {activeCount > 0 && (
            <span className="bg-black text-white text-xs px-2 py-1 font-medium">
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
};

const FiltersSidebar: React.FC<FiltersSidebarProps> = ({
  isOpen,
  onClose,
  categories,
  selectedCategory,
  setSelectedCategory,
  priceRange,
  setPriceRange,
  selectedColors,
  handleColorToggle,
  searchQuery,
  setSearchQuery,
  clearFilters,
  activeFilterCount
}) => {
  const [searchExpanded, setSearchExpanded] = useState(true);
  const [categoryExpanded, setCategoryExpanded] = useState(true);
  const [priceExpanded, setPriceExpanded] = useState(true);
  const [colorExpanded, setColorExpanded] = useState(false);
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed left-0 top-0 h-full w-96 bg-white z-50 shadow-xl overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-black">
                Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Search */}
              <ExpandableSection
                isExpanded={searchExpanded}
                onToggle={() => setSearchExpanded(!searchExpanded)}
                title="Search"
              >
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                />
              </ExpandableSection>

              {/* Category */}
              <ExpandableSection
                isExpanded={categoryExpanded}
                onToggle={() => setCategoryExpanded(!categoryExpanded)}
                title="Category"
                activeCount={selectedCategory ? 1 : 0}
              >
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === ''}
                      onChange={() => setSelectedCategory('')}
                      className="text-black focus:ring-black"
                    />
                    <span className="ml-3 text-sm text-gray-700">All Categories</span>
                  </label>
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === category.slug}
                        onChange={() => setSelectedCategory(category.slug)}
                        className="text-black focus:ring-black"
                      />
                      <span className="ml-3 text-sm text-gray-700">{category.name}</span>
                    </label>
                  ))}
                </div>
              </ExpandableSection>

              {/* Price Range */}
              <ExpandableSection
                isExpanded={priceExpanded}
                onToggle={() => setPriceExpanded(!priceExpanded)}
                title="Price Range (LKR)"
                activeCount={priceRange.min || priceRange.max ? 1 : 0}
              >
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  />
                </div>
              </ExpandableSection>


              {/* Color */}
              <ExpandableSection
                isExpanded={colorExpanded}
                onToggle={() => setColorExpanded(!colorExpanded)}
                title="Color"
                activeCount={selectedColors.length}
              >
                <ColorSelector
                  colors={AVAILABLE_COLORS}
                  selectedColors={selectedColors}
                  onColorSelect={handleColorToggle}
                  multiple={true}
                  size="md"
                  showNames={true}
                  className="grid grid-cols-4 gap-3"
                />
              </ExpandableSection>

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    fullWidth
                  >
                    Clear All Filters ({activeFilterCount})
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FiltersSidebar;