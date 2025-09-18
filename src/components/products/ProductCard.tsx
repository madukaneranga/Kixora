import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useWishlistStore } from '../../stores/wishlistStore';
import { useCartStore } from '../../stores/cartStore';
import Button from '../ui/Button';
import ColorSelector from '../ui/ColorSelector';
import { showSuccessToast, showErrorToast } from '../ui/CustomToast';
import { getColorInfo } from '../../services/colorService';

interface ProductCardProps {
  product: {
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
  };
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { user } = useAuth();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistStore();
  const { addItem } = useCartStore();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [isHovered, setIsHovered] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);

  // Determine which images to use (prioritize images array, fallback to single image)
  const productImages = product.images && product.images.length > 0
    ? product.images
    : product.image
    ? [product.image]
    : [];

  const primaryImage = productImages[0];
  const secondaryImage = productImages.length > 1 ? productImages[1] : null;

  const inWishlist = user ? isInWishlist(product.id) : false;

  // Smart variant detection
  const hasVariants = product.variants && product.variants.length > 0;
  const availableSizes = hasVariants ? [...new Set(product.variants.map(v => v.size).filter(Boolean))] : [];
  const availableColors = hasVariants ? [...new Set(product.variants.map(v => v.color).filter(Boolean))] : [];

  const hasSize = availableSizes.length > 0;
  const hasColor = availableColors.length > 0;

  // Determine variant scenario
  const variantScenario = hasSize && hasColor ? 'size-color' :
                          hasSize ? 'size-only' :
                          hasColor ? 'color-only' : 'stock-only';

  // Find the selected variant based on scenario
  const selectedVariant = !hasVariants ? null :
    variantScenario === 'stock-only' ? product.variants[0] :
    variantScenario === 'size-only' ? product.variants.find(v => v.size === selectedSize) :
    variantScenario === 'color-only' ? product.variants.find(v => v.color === selectedColor) :
    product.variants.find(v => v.size === selectedSize && v.color === selectedColor);

  // Check if add to cart should be enabled based on variant scenario
  const canAddToCart = !hasVariants ? false :
    variantScenario === 'stock-only' ? selectedVariant && selectedVariant.stock > 0 :
    variantScenario === 'size-only' ? selectedSize && selectedVariant && selectedVariant.stock > 0 :
    variantScenario === 'color-only' ? selectedColor && selectedVariant && selectedVariant.stock > 0 :
    selectedSize && selectedColor && selectedVariant && selectedVariant.stock > 0;

  const handleWishlistToggle = async () => {
    if (!user) {
      showErrorToast('Please sign in to add to wishlist');
      return;
    }

    setIsLoading(true);
    try {
      if (inWishlist) {
        await removeFromWishlist(user.id, product.id);
        showSuccessToast('Removed from wishlist');
      } else {
        await addToWishlist(user.id, product.id);
        showSuccessToast('Added to wishlist');
      }
    } catch (error) {
      console.error('Wishlist error:', error);
      showErrorToast('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAdd = async () => {
    if (!selectedVariant) {
      // Dynamic validation based on variant scenario
      if (variantScenario === 'size-color') {
        let missing = [];
        if (!selectedSize) missing.push('size');
        if (!selectedColor) missing.push('color');
        showErrorToast(`Please select ${missing.join(' and ')}`);
      } else if (variantScenario === 'size-only') {
        showErrorToast('Please select size');
      } else if (variantScenario === 'color-only') {
        showErrorToast('Please select color');
      } else {
        showErrorToast('Product configuration error');
      }
      return;
    }

    // Enhanced stock validation matching ProductDetailPage
    if (!selectedVariant.stock || selectedVariant.stock < 1) {
      showErrorToast('Not enough stock available');
      return;
    }

    await addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      title: product.title,
      variant: {
        size: selectedVariant.size,
        color: selectedVariant.color,
        sku: `${product.id}-${selectedVariant.id}`,
      },
      price: product.price,
      quantity: 1,
      image: primaryImage,
      maxStock: selectedVariant.stock,
    }, user?.id);

    showSuccessToast('Added to cart');
    // Reset selections
    setSelectedSize('');
    setSelectedColor('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
    >
      <div
        className="relative aspect-[4/5] overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link to={`/products/${product.id}`}>
          {primaryImage ? (
            <div className="relative w-full h-full">
              {/* Primary Image */}
              <motion.img
                key="primary"
                src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${primaryImage}`}
                alt={product.title}
                className="absolute inset-0 w-full h-full object-cover"
                initial={false}
                animate={{
                  opacity: isHovered && secondaryImage ? 0 : 1,
                  scale: isHovered ? 1.05 : 1,
                }}
                transition={{
                  opacity: { duration: 0.3, ease: "easeInOut" },
                  scale: { duration: 0.5, ease: "easeOut" }
                }}
              />

              {/* Secondary Image - Only render if it exists */}
              {secondaryImage && (
                <motion.img
                  key="secondary"
                  src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${secondaryImage}`}
                  alt={`${product.title} - Alternative view`}
                  className="absolute inset-0 w-full h-full object-cover"
                  initial={false}
                  animate={{
                    opacity: isHovered ? 1 : 0,
                    scale: isHovered ? 1.05 : 1,
                  }}
                  transition={{
                    opacity: { duration: 0.3, ease: "easeInOut" },
                    scale: { duration: 0.5, ease: "easeOut" }
                  }}
                />
              )}
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <ShoppingCart className="h-8 w-8 sm:h-12 sm:w-12 text-slate-400" />
            </div>
          )}
        </Link>

        {product.featured && (
          <div className="absolute top-3 left-3">
            <span className="bg-black text-white text-xs font-semibold px-2 py-1">
              Featured
            </span>
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleWishlistToggle}
          disabled={isLoading}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
            inWishlist
              ? 'bg-black text-white'
              : 'bg-white/90 text-black hover:bg-black hover:text-white'
          }`}
        >
          <Heart size={16} fill={inWishlist ? 'currentColor' : 'none'} />
        </motion.button>

        {/* Quick Add Button - Mobile Only */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setShowQuickAddModal(true);
          }}
          className="absolute bottom-3 right-3 w-9 h-9 bg-black text-white rounded-full shadow-lg flex items-center justify-center transition-colors hover:bg-gray-800 md:hidden"
        >
          <Plus size={16} />
        </motion.button>

      </div>

      <div className="p-4 relative">
        <Link to={`/products/${product.id}`}>
          {product.brand && (
            <p className="text-xs text-gray-500 mb-1">{product.brand}</p>
          )}
          <h3 className="font-medium text-sm text-black mb-2 line-clamp-2 group-hover:text-gray-700 transition-colors">
            {product.title}
          </h3>
        </Link>

        <div className="flex items-center justify-between mb-3">
          <p className="text-base font-semibold text-black">
            LKR {product.price.toLocaleString()}
          </p>

          {product.variants && product.variants.length > 0 && (
            <div className="flex gap-1">
              {[...new Set(product.variants.slice(0, 4).map(v => v.color).filter(Boolean))].map((color) => {
                const colorInfo = getColorInfo(color);
                return colorInfo ? (
                  <div
                    key={color}
                    className="w-4 h-4 rounded-full border border-gray-300 overflow-hidden"
                    title={colorInfo.displayName}
                  >
                    <img
                      src={colorInfo.image}
                      alt={colorInfo.displayName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    key={color}
                    className="w-4 h-4 rounded-full border border-gray-300 bg-gray-200 flex items-center justify-center"
                    title={color}
                  >
                    <span className="text-[8px] text-gray-500">?</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>


        {/* Desktop/Tablet Hover Overlay - Hidden on mobile */}
        <div className="hidden md:block absolute inset-x-0 -bottom-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-none group-hover:pointer-events-auto">
          <div className="bg-white shadow-xl border border-gray-200 p-4 space-y-3">
            {hasSize && (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">Size</p>
                <div className="flex space-x-1">
                  {availableSizes.map((size) => {
                    const hasStock = product.variants?.some(v =>
                      v.size === size &&
                      (!hasColor || !selectedColor || v.color === selectedColor) &&
                      v.stock && v.stock > 0
                    );
                    return (
                      <button
                        key={size}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSize(size === selectedSize ? '' : size);
                        }}
                        disabled={!hasStock}
                        className={`px-2 py-1 text-xs border transition-colors ${
                          selectedSize === size
                            ? 'bg-black text-white border-black'
                            : hasStock
                            ? 'bg-white text-gray-700 border-gray-300 hover:border-black'
                            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {hasColor && (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">Color</p>
                <div onClick={(e) => e.stopPropagation()}>
                  <ColorSelector
                    colors={availableColors}
                    selectedColors={selectedColor ? [selectedColor] : []}
                    onColorSelect={(color) => setSelectedColor(color === selectedColor ? '' : color)}
                    multiple={false}
                    size="sm"
                    disabledColors={availableColors.filter(color => {
                      return !product.variants?.some(v =>
                        v.color === color &&
                        (!hasSize || !selectedSize || v.size === selectedSize) &&
                        v.stock && v.stock > 0
                      );
                    })}
                  />
                </div>
              </div>
            )}

            {selectedVariant && (
              <div className="mb-2">
                {selectedVariant.stock && selectedVariant.stock > 0 ? (
                  selectedVariant.stock <= 10 && (
                    <p className="text-xs text-orange-600 font-medium mb-2">
                      Only {selectedVariant.stock} left!
                    </p>
                  )
                ) : (
                  <p className="text-xs text-red-600 font-medium mb-2">
                    Out of Stock
                  </p>
                )}
              </div>
            )}

            <Button
              variant="primary"
              size="sm"
              fullWidth
              onClick={handleQuickAdd}
              disabled={!canAddToCart}
              className={`text-xs ${
                canAddToCart
                  ? 'bg-black text-white hover:bg-gray-900'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {variantScenario === 'stock-only'
                ? selectedVariant?.stock === 0 ? 'Out of Stock' : 'Add to Cart'
                : variantScenario === 'size-only'
                ? !selectedSize ? 'Select Size' : selectedVariant?.stock === 0 ? 'Out of Stock' : 'Add to Cart'
                : variantScenario === 'color-only'
                ? !selectedColor ? 'Select Color' : selectedVariant?.stock === 0 ? 'Out of Stock' : 'Add to Cart'
                : !selectedSize || !selectedColor
                ? `Select ${!selectedSize && !selectedColor ? 'Size & Color' : !selectedSize ? 'Size' : 'Color'}`
                : selectedVariant?.stock === 0 ? 'Out of Stock' : 'Add to Cart'
              }
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Add Modal - Mobile Only */}
      <AnimatePresence>
        {showQuickAddModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuickAddModal(false)}
              className="fixed inset-0 bg-black/50 z-50 md:hidden"
            />

            {/* Modal */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 md:hidden max-h-[80vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {primaryImage && (
                    <img
                      src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${primaryImage}`}
                      alt={product.title}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-sm text-black line-clamp-1">{product.title}</h3>
                    <p className="text-base font-bold text-black">LKR {product.price.toLocaleString()}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowQuickAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4 space-y-4">
                {hasSize && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">Select Size</p>
                    <div className="flex flex-wrap gap-2">
                      {availableSizes.map((size) => {
                        const hasStock = product.variants?.some(v =>
                          v.size === size &&
                          (!hasColor || !selectedColor || v.color === selectedColor) &&
                          v.stock && v.stock > 0
                        );
                        return (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size === selectedSize ? '' : size)}
                            disabled={!hasStock}
                            className={`px-4 py-3 text-sm border rounded-lg transition-colors min-w-[50px] ${
                              selectedSize === size
                                ? 'bg-black text-white border-black'
                                : hasStock
                                ? 'bg-white text-gray-700 border-gray-300 hover:border-black'
                                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {hasColor && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">Select Color</p>
                    <ColorSelector
                      colors={availableColors}
                      selectedColors={selectedColor ? [selectedColor] : []}
                      onColorSelect={(color) => setSelectedColor(color === selectedColor ? '' : color)}
                      multiple={false}
                      size="lg"
                      disabledColors={availableColors.filter(color => {
                        return !product.variants?.some(v =>
                          v.color === color &&
                          (!hasSize || !selectedSize || v.size === selectedSize) &&
                          v.stock && v.stock > 0
                        );
                      })}
                    />
                  </div>
                )}

                {/* Stock Status */}
                {selectedVariant && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    {selectedVariant.stock && selectedVariant.stock > 0 ? (
                      selectedVariant.stock <= 10 && (
                        <p className="text-sm text-orange-600 font-medium">
                          Only {selectedVariant.stock} left in stock!
                        </p>
                      )
                    ) : (
                      <p className="text-sm text-red-600 font-medium">
                        Out of Stock
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={async () => {
                    await handleQuickAdd();
                    setShowQuickAddModal(false);
                  }}
                  disabled={!canAddToCart}
                  className={`min-h-[52px] text-base font-semibold ${
                    canAddToCart
                      ? 'bg-black text-white hover:bg-gray-900'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {variantScenario === 'stock-only'
                    ? selectedVariant?.stock === 0 ? 'Out of Stock' : 'Add to Cart'
                    : variantScenario === 'size-only'
                    ? !selectedSize ? 'Select Size' : selectedVariant?.stock === 0 ? 'Out of Stock' : 'Add to Cart'
                    : variantScenario === 'color-only'
                    ? !selectedColor ? 'Select Color' : selectedVariant?.stock === 0 ? 'Out of Stock' : 'Add to Cart'
                    : !selectedSize || !selectedColor
                    ? `Select ${!selectedSize && !selectedColor ? 'Size & Color' : !selectedSize ? 'Size' : 'Color'}`
                    : selectedVariant?.stock === 0 ? 'Out of Stock' : 'Add to Cart'
                  }
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProductCard;