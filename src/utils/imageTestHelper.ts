// Image Selection Testing Utility
export interface ImageTestResult {
  selectedImage: {
    storage_path: string;
    is_primary: boolean;
    display_order: number;
    alt_text?: string;
  } | null;
  allImages: Array<{
    storage_path: string;
    is_primary: boolean;
    display_order: number;
    alt_text?: string;
  }>;
  selectionReason: string;
  fullUrl: string;
  socialShareUrl: string;
}

// Test which image will be used for social sharing
export const testImageSelection = (product: any): ImageTestResult => {
  const allImages = product.product_images || [];

  // Find primary image first
  const primaryImage = allImages.find((img: any) => img.is_primary);

  // Fallback to first image (should be sorted by display_order)
  const firstImage = allImages[0];

  // Final selection
  const selectedImage = primaryImage || firstImage || null;

  let selectionReason = '';
  if (primaryImage) {
    selectionReason = 'Selected primary image (is_primary = true)';
  } else if (firstImage) {
    selectionReason = 'No primary image found, using first image (sorted by display_order)';
  } else {
    selectionReason = 'No images found, will use fallback logo';
  }

  const fullUrl = selectedImage?.storage_path
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/kixora/${selectedImage.storage_path}`
    : `${window.location.origin}/logo.white.png`;

  const socialShareUrl = fullUrl;

  return {
    selectedImage,
    allImages,
    selectionReason,
    fullUrl,
    socialShareUrl
  };
};

// Test collection image selection
export const testCollectionImageSelection = (collection: any) => {
  const imageUrl = collection.image_url;

  return {
    selectedImage: imageUrl,
    selectionReason: collection.image_url ? 'Using collection.image_url' : 'No collection image, will use fallback logo',
    fullUrl: imageUrl || `${window.location.origin}/logo.white.png`,
    socialShareUrl: imageUrl || `${window.location.origin}/logo.white.png`
  };
};

// Console helper to test current page image selection
export const testCurrentPageImage = () => {
  const path = window.location.pathname;

  if (path.includes('/products/')) {
    console.group('🖼️ Testing Product Image Selection');
    console.log('Current implementation will:');
    console.log('1. Look for product image with is_primary = true');
    console.log('2. If no primary image, use first image (sorted by display_order)');
    console.log('3. If no images at all, use /logo.white.png');
    console.log('');
    console.log('✅ Social sharing will show the PRIMARY image you set in admin');
    console.log('📋 To test: Add window.testProductImage(productData) to your product page');
    console.groupEnd();
  } else if (path.includes('/collections/')) {
    console.group('🖼️ Testing Collection Image Selection');
    console.log('Current implementation will:');
    console.log('1. Use collection.image_url (the featured collection image)');
    console.log('2. If no collection image, use /logo.white.png');
    console.log('');
    console.log('✅ Social sharing will show the COLLECTION featured image');
    console.log('📋 To test: Add window.testCollectionImage(collectionData) to your collection page');
    console.groupEnd();
  } else {
    console.log('🏠 Not on a product or collection page - image selection varies by page type');
  }
};

// Make available globally for browser testing
if (typeof window !== 'undefined') {
  (window as any).testProductImage = testImageSelection;
  (window as any).testCollectionImage = testCollectionImageSelection;
  (window as any).testCurrentPageImage = testCurrentPageImage;
}