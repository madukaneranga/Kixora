import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useWishlistStore } from '../../stores/wishlistStore';
import { useCartStore } from '../../stores/cartStore';
import Button from '../ui/Button';
import ColorSelector from '../ui/ColorSelector';
import { showSuccessToast, showErrorToast } from '../ui/CustomToast';

interface ProductCardProps {
  product: {
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
  };
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { user } = useAuth();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistStore();
  const { addItem } = useCartStore();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

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
      image: product.image,
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
      className="group bg-white shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <Link to={`/products/${product.id}`}>
          {product.image ? (
            <img
              src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/${product.image}`}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <ShoppingCart className="h-12 w-12 text-slate-400" />
            </div>
          )}
        </Link>

        {product.featured && (
          <div className="absolute top-4 left-4">
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
          className={`absolute top-4 right-4 p-2 transition-colors ${
            inWishlist
              ? 'bg-black text-white'
              : 'bg-white/80 text-black hover:bg-black hover:text-white'
          }`}
        >
          <Heart size={16} fill={inWishlist ? 'currentColor' : 'none'} />
        </motion.button>

      </div>

      <div className="p-4 pb-6 relative">
        <Link to={`/products/${product.id}`}>
          {product.brand && (
            <p className="text-xs text-gray-500 mb-1">{product.brand}</p>
          )}
          <h3 className="font-medium text-sm text-black mb-1 line-clamp-2 group-hover:text-gray-700 transition-colors">
            {product.title}
          </h3>
        </Link>

        <div className="flex items-center justify-between mt-2">
          <p className="text-base font-semibold text-black">
            LKR {product.price.toLocaleString()}
          </p>

          {product.variants && product.variants.length > 0 && (
            <ColorSelector
              colors={[...new Set(product.variants.slice(0, 4).map(v => v.color).filter(Boolean))]}
              selectedColors={[]}
              onColorSelect={() => {}}
              size="sm"
              className="gap-1"
              disabled={true}
            />
          )}
        </div>

        {/* Quick Add Overlay - Show on hover at bottom of card */}
        <div className="absolute inset-x-0 -bottom-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-none group-hover:pointer-events-auto">
          <div className="bg-white shadow-xl border border-gray-200 p-4 space-y-3">
            {/* Size Selection - Only show if product has size variants */}
            {hasSize && (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">Size</p>
                <div className="flex space-x-1">
                  {availableSizes.map((size) => {
                    // Enhanced stock checking for current color selection
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

            {/* Color Selection - Only show if product has color variants */}
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
                      // Enhanced stock checking for current size selection
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

            {/* Stock Status and Add to Cart Button */}
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
                ? selectedVariant?.stock === 0
                  ? 'Out of Stock'
                  : 'Add to Cart'
                : variantScenario === 'size-only'
                ? !selectedSize
                  ? 'Select Size'
                  : !selectedVariant
                  ? 'Variant Not Available'
                  : selectedVariant.stock === 0
                  ? 'Out of Stock'
                  : 'Add to Cart'
                : variantScenario === 'color-only'
                ? !selectedColor
                  ? 'Select Color'
                  : !selectedVariant
                  ? 'Variant Not Available'
                  : selectedVariant.stock === 0
                  ? 'Out of Stock'
                  : 'Add to Cart'
                : !selectedSize || !selectedColor
                ? `Select ${!selectedSize && !selectedColor ? 'Size & Color' : !selectedSize ? 'Size' : 'Color'}`
                : !selectedVariant
                ? 'Variant Not Available'
                : selectedVariant.stock === 0
                ? 'Out of Stock'
                : 'Add to Cart'
              }
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;