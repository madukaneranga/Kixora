import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Heart,
  Star,
  Minus,
  Plus,
  ShoppingCart,
  Truck,
  Shield,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Share2,
  Check,
  AlertCircle,
  Clock,
  MapPin,
  CreditCard,
  Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useCartStore } from '../stores/cartStore';
import { useWishlistStore } from '../stores/wishlistStore';
import Button from '../components/ui/Button';
import ColorSelector from '../components/ui/ColorSelector';
import { showSuccessToast, showErrorToast } from '../components/ui/CustomToast';
import Breadcrumb from '../components/ui/Breadcrumb';
import ProductCard from '../components/products/ProductCard';
import SEOHead from '../components/seo/SEOHead';
import { generateSEOData } from '../hooks/useSEO';
import { generateProductSchema, generateBreadcrumbSchema } from '../utils/structuredData';

interface Product {
  id: string;
  sku: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  category_id: string | null;
  is_active: boolean;
  featured: boolean;
  is_returnable: boolean;
  return_days: number;
  created_at: string;
  updated_at: string;
  categories?: {
    slug: string;
    name: string;
  };
  product_images?: Array<{
    id: string;
    storage_path: string;
    alt_text: string | null;
    display_order: number;
  }>;
  product_variants?: Array<{
    id: string;
    sku: string;
    size: string | null;
    color: string | null;
    price_override: number | null;
    stock: number;
    is_active: boolean;
  }>;
}

interface RelatedProduct {
  id: string;
  title: string;
  slug?: string;
  brand?: string;
  price: number;
  image?: string;
  images?: string[];
  variants?: Array<{
    id: string;
    size: string;
    color: string;
    stock: number;
  }>;
}

// Helper function to check if a string is a UUID
const isUUID = (str: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

const ProductDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCartStore();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'shipping'>('description');
  const [isZoomed, setIsZoomed] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<string>('');

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  useEffect(() => {
    if (product?.category_id) {
      fetchRelatedProducts();
    }
  }, [product]);

  const fetchProduct = async () => {
    if (!slug) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            slug,
            name
          ),
          product_images (
            id,
            storage_path,
            alt_text,
            display_order
          ),
          product_variants (
            id,
            sku,
            size,
            color,
            price_override,
            stock,
            is_active
          )
        `)
        .eq(isUUID(slug) ? 'id' : 'slug', slug)
        .eq('is_active', true)
        .is('deleted_at', null)
        .single();

      if (error) throw error;
      
      // Sort images by display_order
      if (data.product_images) {
        data.product_images.sort((a, b) => a.display_order - b.display_order);
      }

      // Filter out inactive variants and sort by size and color
      if (data.product_variants) {
        data.product_variants = data.product_variants.filter(v => v.is_active !== false);
        data.product_variants.sort((a, b) => {
          if (a.size && b.size) {
            return parseInt(a.size) - parseInt(b.size);
          }
          return a.color?.localeCompare(b.color || '') || 0;
        });
        
        // Auto-select first available variant
        const firstAvailableVariant = data.product_variants.find(v => v.is_active && v.stock > 0);
        if (firstAvailableVariant) {
          setSelectedVariant(firstAvailableVariant.id);
        }
      }

      setProduct(data);

    } catch (error) {
      console.error('Error fetching product:', error);
      showErrorToast('Product not found');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };


  const fetchRelatedProducts = async () => {
    if (!product?.category_id) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          title,
          slug,
          price,
          brands (
            name
          ),
          product_images (
            storage_path,
            display_order
          ),
          product_variants (
            id,
            size,
            color,
            stock,
            is_active
          )
        `)
        .eq('category_id', product.category_id)
        .eq('is_active', true)
        .is('deleted_at', null)
        .neq('id', product.id)
        .limit(4);

      if (error) throw error;

      const related = data?.map(item => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        brand: item.brands?.name,
        price: item.price,
        image: item.product_images?.[0]?.storage_path,
        images: item.product_images?.map(img => img.storage_path) || [],
        variants: item.product_variants?.filter(v => v.is_active !== false).map(v => ({
          id: v.id,
          size: v.size || '',
          color: v.color || '',
          stock: v.stock
        })) || []
      })) || [];

      setRelatedProducts(related);
    } catch (error) {
      console.error('Error fetching related products:', error);
    }
  };

  const handleWishlistToggle = async () => {
    if (!user || !product) {
      showErrorToast('Please sign in to add to wishlist');
      return;
    }

    try {
      if (isInWishlist(product.id)) {
        await removeFromWishlist(user.id, product.id);
        showSuccessToast('Removed from wishlist');
      } else {
        await addToWishlist(user.id, product.id);
        showSuccessToast('Added to wishlist');
      }
    } catch (error) {
      showErrorToast('Something went wrong');
    }
  };


  const handleAddToCart = async () => {
    if (!product) {
      showErrorToast('Product not found');
      return;
    }

    // Check if product has variants
    const hasVariants = product.product_variants && product.product_variants.length > 0;
    const hasSize = hasVariants && product.product_variants.some(v => v.size);
    const hasColor = hasVariants && product.product_variants.some(v => v.color);

    if (!hasVariants) {
      showErrorToast('Product configuration error - no variants found');
      return;
    }

    // All products should have variants (even if just for stock tracking)
    if (hasSize || hasColor) {
      // Product has actual size/color variants - user must select them
      if (!selectedVariant) {
        let missingSelections = [];
        if (hasSize) missingSelections.push('size');
        if (hasColor) missingSelections.push('color');
        showErrorToast(`Please select ${missingSelections.join(' and ')}`);
        return;
      }
    } else {
      // Product has variants but only for stock tracking (no size/color)
      // selectedVariant should already be auto-selected
      if (!selectedVariant) {
        showErrorToast('Please try again');
        return;
      }
    }

    const variant = product.product_variants.find(v => v.id === selectedVariant);
    if (!variant || variant.stock < quantity) {
      showErrorToast('Not enough stock available');
      return;
    }

    await addItem({
      productId: product.id,
      variantId: variant.id,
      title: product.title,
      variant: {
        size: variant.size || '',
        color: variant.color || '',
        sku: variant.sku,
      },
      price: variant.price_override || product.price,
      quantity,
      image: product.product_images?.[0]?.storage_path,
      maxStock: variant.stock,
    }, user?.id);

    showSuccessToast('Added to cart!');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.title,
          text: `Check out ${product?.title}`,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      showSuccessToast('Link copied to clipboard!');
    }
  };

  const getSelectedVariant = () => {
    return product?.product_variants?.find(v => v.id === selectedVariant);
  };

  const getCurrentPrice = () => {
    const variant = getSelectedVariant();
    return variant?.price_override || product?.price || 0;
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Product not found</h2>
          <Button onClick={() => navigate('/products')}>Back to Products</Button>
        </div>
      </div>
    );
  }

  const currentVariant = getSelectedVariant();

  // Generate breadcrumb items
  const breadcrumbItems = [
    {
      label: 'Products',
      path: '/products',
      icon: <Package size={16} />
    },
    ...(product.categories ? [{
      label: product.categories.name,
      path: `/products?category=${product.categories.slug}`
    }] : []),
    {
      label: product.title
    }
  ];

  return (
    <>
      <SEOHead
        seoData={generateSEOData.product(product)}
        structuredData={[
          { schema: generateProductSchema(product), id: 'product-schema' },
          { schema: generateBreadcrumbSchema(breadcrumbItems.map(item => ({
            name: typeof item.label === 'string' ? item.label : item.label || '',
            url: item.href || '#'
          }))), id: 'breadcrumb-schema' }
        ]}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} className="mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Product Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative aspect-square bg-slate-100 overflow-hidden group">
            {product.product_images && product.product_images.length > 0 ? (
              <motion.img
                key={selectedImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/kixora/${product.product_images[selectedImageIndex]?.storage_path}`}
                alt={product.product_images[selectedImageIndex]?.alt_text || product.title}
                className={`w-full h-full object-cover transition-transform duration-300 ${isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'}`}
                onClick={() => setIsZoomed(!isZoomed)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                <ShoppingCart className="h-24 w-24 text-slate-400" />
              </div>
            )}
            
            {/* Image Navigation */}
            {product.product_images && product.product_images.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImageIndex(prev => 
                    prev === 0 ? product.product_images!.length - 1 : prev - 1
                  )}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setSelectedImageIndex(prev => 
                    prev === product.product_images!.length - 1 ? 0 : prev + 1
                  )}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="absolute top-4 right-4 bg-white/80 hover:bg-white p-2 transition-colors"
            >
              <Share2 size={16} />
            </button>
          </div>

          {/* Thumbnail Images */}
          {product.product_images && product.product_images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto">
              {product.product_images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 overflow-hidden border-2 transition-colors ${
                    selectedImageIndex === index
                      ? 'border-black'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <img
                    src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/kixora/${image.storage_path}`}
                    alt={image.alt_text || product.title}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">{product.title}</h1>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleWishlistToggle}
                className={`p-2 transition-colors ${
                  user && isInWishlist(product.id)
                    ? 'bg-black text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-black hover:text-white'
                }`}
              >
                <Heart size={20} fill={user && isInWishlist(product.id) ? 'currentColor' : 'none'} />
              </motion.button>
            </div>


            {/* Price */}
            <div className="mb-6">
              <span className="text-2xl md:text-3xl font-bold text-slate-900">
                LKR {getCurrentPrice().toLocaleString()}
              </span>
              {currentVariant?.price_override && currentVariant.price_override !== product.price && (
                <span className="text-lg text-slate-500 line-through ml-2">
                  LKR {product.price.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Size & Color Selection */}
          {product.product_variants && product.product_variants.length > 0 && (
              <div className="space-y-4">
                {/* Size Selection */}
                {product.product_variants.some(v => v.size) && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Size: {currentVariant?.size && <span className="font-normal">{currentVariant.size}</span>}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(product.product_variants.filter(v => v.size).map(v => v.size)))
                        .sort((a, b) => parseInt(a!) - parseInt(b!))
                        .map(size => {
                          const variant = product.product_variants?.find(v =>
                            v.size === size &&
                            (!currentVariant?.color || v.color === currentVariant.color)
                          );
                          const isSelected = currentVariant?.size === size;
                          const isAvailable = variant && variant.is_active && variant.stock > 0;

                          return (
                            <button
                              key={size}
                              onClick={() => variant && setSelectedVariant(variant.id)}
                              disabled={!isAvailable}
                              className={`px-4 py-2 border text-sm font-medium transition-colors ${
                                isSelected
                                  ? 'bg-black text-white border-black'
                                  : isAvailable
                                  ? 'bg-white text-slate-700 border-slate-300 hover:border-black'
                                  : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                              }`}
                            >
                              {size}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Color Selection */}
                {product.product_variants.some(v => v.color) && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Color: {currentVariant?.color && <span className="font-normal">{currentVariant.color}</span>}
                    </label>
                    <ColorSelector
                      colors={Array.from(new Set(product.product_variants.filter(v => v.color).map(v => v.color!))).filter(Boolean)}
                      selectedColors={currentVariant?.color ? [currentVariant.color] : []}
                      onColorSelect={(color) => {
                        const variant = product.product_variants?.find(v =>
                          v.color === color &&
                          (!currentVariant?.size || v.size === currentVariant.size)
                        );
                        if (variant) {
                          setSelectedVariant(variant.id);
                        }
                      }}
                      multiple={false}
                      size="lg"
                      disabledColors={Array.from(new Set(product.product_variants.filter(v => v.color).map(v => v.color!))).filter(color => {
                        const variant = product.product_variants?.find(v =>
                          v.color === color &&
                          (!currentVariant?.size || v.size === currentVariant.size)
                        );
                        return !variant || !variant.is_active || variant.stock === 0;
                      })}
                      className="flex flex-wrap gap-3"
                    />
                  </div>
                )}

                {/* Stock Status */}
                {currentVariant && (
                  <div className="flex items-center space-x-2">
                    {currentVariant.stock > 0 ? (
                      <>
                        <Check size={16} className="text-black" />
                        <span className="text-sm text-black font-medium">
                          {currentVariant.stock > 10 ? 'In Stock' : `Only ${currentVariant.stock} left!`}
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={16} className="text-black" />
                        <span className="text-sm text-black font-medium">Out of Stock</span>
                      </>
                    )}
                  </div>
                )}
              </div>
          )}

          {/* Quantity & Add to Cart */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Quantity</label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 border border-slate-300 hover:bg-slate-50"
                >
                  <Minus size={16} />
                </button>
                <span className="px-4 py-2 border border-slate-300 min-w-[60px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => {
                    const maxStock = currentVariant?.stock || 1;
                    setQuantity(Math.min(maxStock, quantity + 1));
                  }}
                  disabled={!currentVariant || quantity >= currentVariant.stock}
                  className="p-2 border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button
                variant="primary"
                size="lg"
                onClick={handleAddToCart}
                disabled={(() => {
                  const hasVariants = product.product_variants && product.product_variants.length > 0;
                  if (!hasVariants) return false; // No variants, always enabled

                  // Has variants - check if variant is selected and has stock
                  return !currentVariant || currentVariant.stock === 0;
                })()}
                className="flex-1 flex items-center justify-center space-x-2"
              >
                <ShoppingCart size={20} />
                <span>Add to Cart</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  handleAddToCart();
                  navigate('/checkout');
                }}
                disabled={(() => {
                  const hasVariants = product.product_variants && product.product_variants.length > 0;
                  if (!hasVariants) return false; // No variants, always enabled

                  // Has variants - check if variant is selected and has stock
                  return !currentVariant || currentVariant.stock === 0;
                })()}
              >
                Buy Now
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100">
                <Truck size={20} className="text-black" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Free Shipping</p>
                <p className="text-xs text-slate-600">On orders over LKR 15,000</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100">
                <Shield size={20} className="text-black" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Secure Payment</p>
                <p className="text-xs text-slate-600">100% secure checkout</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100">
                <RotateCcw size={20} className="text-black" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Returns</p>
                <Link
                  to="/refund-policy"
                  className="text-xs text-slate-600 hover:text-slate-900 underline"
                >
                  Check return policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="mb-16">
        <div className="border-b border-slate-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'description', label: 'Description' },
              { id: 'shipping', label: 'Shipping & Returns' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-black text-black'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'description' && (
              <div className="prose prose-slate max-w-none">
                {product.description ? (
                  <div dangerouslySetInnerHTML={{ __html: product.description.replace(/\n/g, '<br />') }} />
                ) : (
                  <p className="text-slate-600">No description available for this product.</p>
                )}
              </div>
            )}


            {activeTab === 'shipping' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Shipping Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Truck size={16} className="text-slate-400" />
                      <span className="text-slate-600">Free standard delivery on orders over LKR 15,000</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock size={16} className="text-slate-400" />
                      <span className="text-slate-600">Standard delivery: 3-7 business days (LKR 399)</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock size={16} className="text-slate-400" />
                      <span className="text-slate-600">Express delivery: 1-3 business days (LKR 699)</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin size={16} className="text-slate-400" />
                      <span className="text-slate-600">Island-wide delivery across Sri Lanka</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Package size={16} className="text-slate-400" />
                      <span className="text-slate-600">Orders processed within 1-2 business days</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CreditCard size={16} className="text-slate-400" />
                      <span className="text-slate-600">Cash on Delivery available in Colombo only</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Returns & Exchanges</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <RotateCcw size={16} className="text-slate-400" />
                      <span className="text-slate-600">14-day return policy from delivery date</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Shield size={16} className="text-slate-400" />
                      <span className="text-slate-600">Items must be unworn and in original packaging</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CreditCard size={16} className="text-slate-400" />
                      <span className="text-slate-600">Refunds processed within 5-7 business days</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Package size={16} className="text-slate-400" />
                      <span className="text-slate-600">Original receipt or order confirmation required</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <AlertCircle size={16} className="text-slate-400" />
                      <span className="text-slate-600">Sale items non-refundable (unless defective)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-8">You might also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard
                key={relatedProduct.id}
                product={{
                  id: relatedProduct.id,
                  title: relatedProduct.title,
                  slug: relatedProduct.slug,
                  brand: relatedProduct.brand,
                  price: relatedProduct.price,
                  image: relatedProduct.image,
                  images: relatedProduct.images,
                  variants: relatedProduct.variants
                }}
              />
            ))}
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default ProductDetailPage;