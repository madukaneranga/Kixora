// Social Share Testing and Preview Utility
export interface SocialShareData {
  title: string;
  description: string;
  image: string;
  url: string;
  type: string;
}

export interface SocialShareTest {
  facebook: {
    title: string | null;
    description: string | null;
    image: string | null;
    url: string | null;
    type: string | null;
  };
  twitter: {
    card: string | null;
    title: string | null;
    description: string | null;
    image: string | null;
  };
  linkedin: {
    title: string | null;
    description: string | null;
    image: string | null;
    url: string | null;
  };
  issues: string[];
}

// Test current page's social sharing implementation
export const testSocialSharing = (): SocialShareTest => {
  const issues: string[] = [];

  // Facebook/Open Graph
  const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
  const ogDescription = document.querySelector('meta[property="og:description"]')?.getAttribute('content');
  const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
  const ogUrl = document.querySelector('meta[property="og:url"]')?.getAttribute('content');
  const ogType = document.querySelector('meta[property="og:type"]')?.getAttribute('content');

  // Twitter
  const twitterCard = document.querySelector('meta[name="twitter:card"]')?.getAttribute('content');
  const twitterTitle = document.querySelector('meta[name="twitter:title"]')?.getAttribute('content');
  const twitterDescription = document.querySelector('meta[name="twitter:description"]')?.getAttribute('content');
  const twitterImage = document.querySelector('meta[name="twitter:image"]')?.getAttribute('content');

  // Validation
  if (!ogTitle) issues.push('Missing Open Graph title - Facebook/LinkedIn previews will be poor');
  if (!ogDescription) issues.push('Missing Open Graph description - Social previews will be incomplete');
  if (!ogImage) issues.push('Missing Open Graph image - No preview image will show');
  if (!ogUrl) issues.push('Missing Open Graph URL - Social platforms may not track properly');

  if (!twitterCard) issues.push('Missing Twitter Card - Twitter previews will be basic');
  if (!twitterTitle) issues.push('Missing Twitter title - Twitter previews will use page title');
  if (!twitterImage) issues.push('Missing Twitter image - No image preview on Twitter');

  // Image validation
  if (ogImage && !ogImage.startsWith('http')) {
    issues.push('Open Graph image should be absolute URL for best compatibility');
  }

  if (twitterImage && !twitterImage.startsWith('http')) {
    issues.push('Twitter image should be absolute URL for best compatibility');
  }

  return {
    facebook: {
      title: ogTitle,
      description: ogDescription,
      image: ogImage,
      url: ogUrl,
      type: ogType,
    },
    twitter: {
      card: twitterCard,
      title: twitterTitle,
      description: twitterDescription,
      image: twitterImage,
    },
    linkedin: {
      title: ogTitle, // LinkedIn uses Open Graph
      description: ogDescription,
      image: ogImage,
      url: ogUrl,
    },
    issues
  };
};

// Generate preview URLs for testing
export const generateSocialPreviewUrls = (pageUrl: string) => {
  const encodedUrl = encodeURIComponent(pageUrl);

  return {
    facebook: `https://developers.facebook.com/tools/debug/sharing/?q=${encodedUrl}`,
    twitter: `https://cards-dev.twitter.com/validator?url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/post-inspector/inspect/${encodedUrl}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}`
  };
};

// Test specific product social sharing
export const testProductSocialSharing = (product: any) => {
  // Find primary image first, then fallback to first image, then fallback to logo
  const primaryImage = product.product_images?.find((img: any) => img.is_primary);
  const displayImage = primaryImage || product.product_images?.[0];

  const expectedData = {
    title: `${product.title} - Buy Online at Kixora Sri Lanka`,
    description: `Shop ${product.title} at the best price in Sri Lanka. ${product.description || 'Premium quality with fast delivery and secure payment.'} Free shipping on orders over LKR 5,000.`,
    image: displayImage?.storage_path
      ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/kixora/${displayImage.storage_path}`
      : window.location.origin + '/logo.white.png',
    url: `${window.location.origin}/products/${product.slug || product.id}`,
    type: 'product'
  };

  const currentSocialData = testSocialSharing();
  const issues: string[] = [];

  // Compare expected vs actual
  if (currentSocialData.facebook.title !== expectedData.title) {
    issues.push(`Facebook title mismatch. Expected: "${expectedData.title}", Got: "${currentSocialData.facebook.title}"`);
  }

  if (currentSocialData.facebook.description !== expectedData.description) {
    issues.push(`Facebook description mismatch`);
  }

  if (currentSocialData.facebook.image !== expectedData.image) {
    issues.push(`Facebook image mismatch. Expected: "${expectedData.image}", Got: "${currentSocialData.facebook.image}"`);
  }

  return {
    expected: expectedData,
    actual: currentSocialData,
    issues: [...currentSocialData.issues, ...issues],
    previewUrls: generateSocialPreviewUrls(expectedData.url)
  };
};

// Test collection social sharing
export const testCollectionSocialSharing = (collection: any) => {
  const expectedData = {
    title: `${collection.name} Collection - Kixora Sri Lanka`,
    description: `Discover our ${collection.name} collection. ${collection.description || 'Premium fashion and lifestyle products with exclusive designs.'} Shop now with secure payment and fast delivery.`,
    image: collection.image_url || window.location.origin + '/logo.white.png',
    url: `${window.location.origin}/collections/${collection.slug || collection.id}`,
    type: 'website'
  };

  const currentSocialData = testSocialSharing();
  const issues: string[] = [];

  // Compare expected vs actual
  if (currentSocialData.facebook.title !== expectedData.title) {
    issues.push(`Facebook title mismatch. Expected: "${expectedData.title}", Got: "${currentSocialData.facebook.title}"`);
  }

  return {
    expected: expectedData,
    actual: currentSocialData,
    issues: [...currentSocialData.issues, ...issues],
    previewUrls: generateSocialPreviewUrls(expectedData.url)
  };
};

// Console helper for testing social sharing
export const runSocialShareTest = () => {
  const results = testSocialSharing();
  const previewUrls = generateSocialPreviewUrls(window.location.href);

  console.group('📱 Social Sharing Test Results');
  console.log('Facebook/Open Graph:', results.facebook);
  console.log('Twitter Card:', results.twitter);
  console.log('LinkedIn:', results.linkedin);

  if (results.issues.length > 0) {
    console.log('⚠️ Issues:', results.issues);
  } else {
    console.log('✅ No issues found!');
  }

  console.log('🔗 Test Preview URLs:', previewUrls);
  console.groupEnd();

  return { results, previewUrls };
};

// Auto-test based on current page
export const autoTestCurrentPage = () => {
  const path = window.location.pathname;

  if (path.includes('/products/')) {
    console.log('🛍️ Testing Product Page Social Sharing...');
    // Note: Would need access to product data to fully test
    return runSocialShareTest();
  } else if (path.includes('/collections/')) {
    console.log('📂 Testing Collection Page Social Sharing...');
    return runSocialShareTest();
  } else {
    console.log('🏠 Testing General Page Social Sharing...');
    return runSocialShareTest();
  }
};

// Make available globally for browser testing
if (typeof window !== 'undefined') {
  (window as any).testSocialShare = runSocialShareTest;
  (window as any).autoTestSocialShare = autoTestCurrentPage;
}