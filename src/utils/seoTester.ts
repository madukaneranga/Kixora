// SEO Testing Utility - Comprehensive SEO analysis and validation
export interface SEOTestResults {
  metaTags: {
    title: boolean;
    description: boolean;
    keywords: boolean;
    ogTitle: boolean;
    ogDescription: boolean;
    ogImage: boolean;
    ogUrl: boolean;
    twitterCard: boolean;
    canonical: boolean;
  };
  structuredData: {
    present: boolean;
    valid: boolean;
    schemas: string[];
    errors: string[];
  };
  performance: {
    titleLength: number;
    descriptionLength: number;
    titleOptimal: boolean;
    descriptionOptimal: boolean;
  };
  accessibility: {
    altTags: number;
    missingAltTags: number;
  };
  issues: string[];
  score: number;
}

export const testPageSEO = (): SEOTestResults => {
  const results: SEOTestResults = {
    metaTags: {
      title: false,
      description: false,
      keywords: false,
      ogTitle: false,
      ogDescription: false,
      ogImage: false,
      ogUrl: false,
      twitterCard: false,
      canonical: false,
    },
    structuredData: {
      present: false,
      valid: false,
      schemas: [],
      errors: [],
    },
    performance: {
      titleLength: 0,
      descriptionLength: 0,
      titleOptimal: false,
      descriptionOptimal: false,
    },
    accessibility: {
      altTags: 0,
      missingAltTags: 0,
    },
    issues: [],
    score: 0,
  };

  // Test Meta Tags
  const title = document.title;
  if (title) {
    results.metaTags.title = true;
    results.performance.titleLength = title.length;
    results.performance.titleOptimal = title.length >= 30 && title.length <= 60;
    if (title.length < 30) results.issues.push('Title too short (recommended: 30-60 characters)');
    if (title.length > 60) results.issues.push('Title too long (recommended: 30-60 characters)');
  } else {
    results.issues.push('Missing page title');
  }

  const description = document.querySelector('meta[name="description"]')?.getAttribute('content');
  if (description) {
    results.metaTags.description = true;
    results.performance.descriptionLength = description.length;
    results.performance.descriptionOptimal = description.length >= 120 && description.length <= 160;
    if (description.length < 120) results.issues.push('Description too short (recommended: 120-160 characters)');
    if (description.length > 160) results.issues.push('Description too long (recommended: 120-160 characters)');
  } else {
    results.issues.push('Missing meta description');
  }

  const keywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content');
  results.metaTags.keywords = !!keywords;
  if (!keywords) results.issues.push('Missing meta keywords');

  // Open Graph Tags
  results.metaTags.ogTitle = !!document.querySelector('meta[property="og:title"]');
  results.metaTags.ogDescription = !!document.querySelector('meta[property="og:description"]');
  results.metaTags.ogImage = !!document.querySelector('meta[property="og:image"]');
  results.metaTags.ogUrl = !!document.querySelector('meta[property="og:url"]');

  if (!results.metaTags.ogTitle) results.issues.push('Missing Open Graph title');
  if (!results.metaTags.ogDescription) results.issues.push('Missing Open Graph description');
  if (!results.metaTags.ogImage) results.issues.push('Missing Open Graph image');
  if (!results.metaTags.ogUrl) results.issues.push('Missing Open Graph URL');

  // Twitter Card
  results.metaTags.twitterCard = !!document.querySelector('meta[name="twitter:card"]');
  if (!results.metaTags.twitterCard) results.issues.push('Missing Twitter Card');

  // Canonical URL
  results.metaTags.canonical = !!document.querySelector('link[rel="canonical"]');
  if (!results.metaTags.canonical) results.issues.push('Missing canonical URL');

  // Test Structured Data
  const structuredDataScripts = document.querySelectorAll('script[type="application/ld+json"]');
  if (structuredDataScripts.length > 0) {
    results.structuredData.present = true;

    structuredDataScripts.forEach(script => {
      try {
        const data = JSON.parse(script.textContent || '');
        if (data['@type']) {
          results.structuredData.schemas.push(data['@type']);
        }
        results.structuredData.valid = true;
      } catch (error) {
        results.structuredData.errors.push(`Invalid JSON-LD: ${error}`);
        results.issues.push('Invalid structured data JSON');
      }
    });
  } else {
    results.issues.push('Missing structured data');
  }

  // Test Image Alt Tags
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    if (img.alt) {
      results.accessibility.altTags++;
    } else {
      results.accessibility.missingAltTags++;
    }
  });

  if (results.accessibility.missingAltTags > 0) {
    results.issues.push(`${results.accessibility.missingAltTags} images missing alt tags`);
  }

  // Calculate Score
  let score = 0;
  const maxScore = 100;

  // Meta tags (40 points)
  const metaTagsPresent = Object.values(results.metaTags).filter(Boolean).length;
  const totalMetaTags = Object.keys(results.metaTags).length;
  score += (metaTagsPresent / totalMetaTags) * 40;

  // Performance (30 points)
  if (results.performance.titleOptimal) score += 15;
  if (results.performance.descriptionOptimal) score += 15;

  // Structured Data (20 points)
  if (results.structuredData.present) score += 10;
  if (results.structuredData.valid) score += 10;

  // Accessibility (10 points)
  const totalImages = results.accessibility.altTags + results.accessibility.missingAltTags;
  if (totalImages > 0) {
    score += (results.accessibility.altTags / totalImages) * 10;
  }

  results.score = Math.round(score);

  return results;
};

// Test specific SEO features
export const testDynamicSEO = {
  // Test product page SEO
  testProductSEO: (product: any) => {
    const issues: string[] = [];

    if (!product.title) issues.push('Product missing title');
    if (!product.description) issues.push('Product missing description');
    if (!product.product_images?.length) issues.push('Product missing images');
    if (!product.slug && !product.id) issues.push('Product missing slug or ID');
    if (!product.sku) issues.push('Product missing SKU');

    // Check title length for SEO
    if (product.title && product.title.length < 10) {
      issues.push('Product title too short for SEO');
    }

    // Check description length
    if (product.description && product.description.length < 50) {
      issues.push('Product description too short for SEO');
    }

    return {
      valid: issues.length === 0,
      issues,
      seoData: {
        title: `${product.title} - Buy Online at Kixora Sri Lanka`,
        description: `Shop ${product.title} at the best price in Sri Lanka. ${product.description || 'Premium quality with fast delivery and secure payment.'} Free shipping on orders over LKR 5,000.`,
        url: `/products/${product.slug || product.id}`,
        imageUrl: product.product_images?.[0]?.storage_path
          ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/kixora/${product.product_images[0].storage_path}`
          : '/logo.white.png'
      }
    };
  },

  // Test collection page SEO
  testCollectionSEO: (collection: any) => {
    const issues: string[] = [];

    if (!collection.name) issues.push('Collection missing name');
    if (!collection.slug && !collection.id) issues.push('Collection missing slug or ID');

    return {
      valid: issues.length === 0,
      issues,
      seoData: {
        title: `${collection.name} Collection - Kixora Sri Lanka`,
        description: `Discover our ${collection.name} collection. ${collection.description || 'Premium fashion and lifestyle products with exclusive designs.'} Shop now with secure payment and fast delivery.`,
        url: `/collections/${collection.slug || collection.id}`
      }
    };
  }
};

// SEO audit report generator
export const generateSEOReport = (): string => {
  const results = testPageSEO();

  let report = `
# SEO Audit Report for ${window.location.href}

## Overall Score: ${results.score}/100

### Meta Tags Status:
- Title: ${results.metaTags.title ? '✅' : '❌'}
- Description: ${results.metaTags.description ? '✅' : '❌'}
- Keywords: ${results.metaTags.keywords ? '✅' : '❌'}
- Open Graph Title: ${results.metaTags.ogTitle ? '✅' : '❌'}
- Open Graph Description: ${results.metaTags.ogDescription ? '✅' : '❌'}
- Open Graph Image: ${results.metaTags.ogImage ? '✅' : '❌'}
- Open Graph URL: ${results.metaTags.ogUrl ? '✅' : '❌'}
- Twitter Card: ${results.metaTags.twitterCard ? '✅' : '❌'}
- Canonical URL: ${results.metaTags.canonical ? '✅' : '❌'}

### Performance:
- Title Length: ${results.performance.titleLength} characters ${results.performance.titleOptimal ? '✅' : '⚠️'}
- Description Length: ${results.performance.descriptionLength} characters ${results.performance.descriptionOptimal ? '✅' : '⚠️'}

### Structured Data:
- Present: ${results.structuredData.present ? '✅' : '❌'}
- Valid: ${results.structuredData.valid ? '✅' : '❌'}
- Schemas: ${results.structuredData.schemas.join(', ') || 'None'}

### Accessibility:
- Images with Alt Tags: ${results.accessibility.altTags}
- Images Missing Alt Tags: ${results.accessibility.missingAltTags}

### Issues Found:
${results.issues.map(issue => `- ${issue}`).join('\n') || 'No issues found!'}

### Recommendations:
${results.score < 80 ? `
- Fix the issues listed above
- Ensure all meta tags are present and optimized
- Add structured data if missing
- Optimize title and description lengths
- Add alt tags to all images
` : 'Great job! Your SEO is well optimized.'}
  `;

  return report;
};

// Console helper for quick SEO testing
export const runSEOTest = () => {
  const results = testPageSEO();
  console.group('🔍 SEO Test Results');
  console.log('Score:', results.score + '/100');
  console.log('Meta Tags:', results.metaTags);
  console.log('Structured Data:', results.structuredData);
  console.log('Performance:', results.performance);
  console.log('Issues:', results.issues);
  console.groupEnd();

  // Also log the full report
  console.log('\n' + generateSEOReport());

  return results;
};

// Make it available globally for browser testing
if (typeof window !== 'undefined') {
  (window as any).seoTest = runSEOTest;
  (window as any).seoReport = generateSEOReport;
}