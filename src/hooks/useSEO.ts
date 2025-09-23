import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export interface SEOData {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article' | 'profile';
  siteName?: string;
  locale?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

const DEFAULT_SEO: SEOData = {
  title: 'Kixora - Premium Fashion & Lifestyle Online Store Sri Lanka',
  description: 'Shop the latest fashion trends and premium lifestyle products at Kixora. Secure online shopping with fast delivery across Sri Lanka. Free shipping on orders over LKR 5,000.',
  keywords: 'online shopping sri lanka, fashion store, lifestyle products, premium brands, secure payment, fast delivery',
  siteName: 'Kixora',
  type: 'website',
  locale: 'en_US',
  twitterCard: 'summary_large_image',
  image: '/logo.white.png'
};

export const useSEO = (seoData?: Partial<SEOData>) => {
  const location = useLocation();

  useEffect(() => {
    const mergedSEO: SEOData = {
      ...DEFAULT_SEO,
      ...seoData,
      url: seoData?.url || `${window.location.origin}${location.pathname}`,
      canonical: seoData?.canonical || `${window.location.origin}${location.pathname}`
    };

    // Update document title
    if (mergedSEO.title) {
      document.title = mergedSEO.title;
    }

    // Helper function to update or create meta tag
    const updateMetaTag = (name: string, content: string, property?: string) => {
      if (!content) return;

      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;

      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }

      meta.setAttribute('content', content);
    };

    // Basic Meta Tags
    updateMetaTag('description', mergedSEO.description || '');
    updateMetaTag('keywords', mergedSEO.keywords || '');

    // Robots meta
    const robotsContent = [];
    if (mergedSEO.noindex) robotsContent.push('noindex');
    if (mergedSEO.nofollow) robotsContent.push('nofollow');
    if (robotsContent.length === 0) robotsContent.push('index', 'follow');
    updateMetaTag('robots', robotsContent.join(', '));

    // Open Graph Tags
    updateMetaTag('og:title', mergedSEO.title || '', true);
    updateMetaTag('og:description', mergedSEO.description || '', true);
    updateMetaTag('og:type', mergedSEO.type || 'website', true);
    updateMetaTag('og:url', mergedSEO.url || '', true);
    updateMetaTag('og:site_name', mergedSEO.siteName || 'Kixora', true);
    updateMetaTag('og:locale', mergedSEO.locale || 'en_US', true);

    if (mergedSEO.image) {
      const imageUrl = mergedSEO.image.startsWith('http')
        ? mergedSEO.image
        : `${window.location.origin}${mergedSEO.image}`;
      updateMetaTag('og:image', imageUrl, true);
      updateMetaTag('og:image:width', '1200', true);
      updateMetaTag('og:image:height', '630', true);
      updateMetaTag('og:image:alt', mergedSEO.title || 'Kixora', true);
    }

    // Twitter Card Tags
    updateMetaTag('twitter:card', mergedSEO.twitterCard || 'summary_large_image');
    updateMetaTag('twitter:title', mergedSEO.title || '');
    updateMetaTag('twitter:description', mergedSEO.description || '');
    if (mergedSEO.image) {
      const imageUrl = mergedSEO.image.startsWith('http')
        ? mergedSEO.image
        : `${window.location.origin}${mergedSEO.image}`;
      updateMetaTag('twitter:image', imageUrl);
      updateMetaTag('twitter:image:alt', mergedSEO.title || 'Kixora');
    }

    // Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = mergedSEO.canonical || mergedSEO.url || window.location.href;

    // Language alternate (if needed)
    updateMetaTag('language', 'English');
    updateMetaTag('author', 'Kixora');
    updateMetaTag('copyright', 'Kixora');
    updateMetaTag('generator', 'React, Vite, TypeScript');

  }, [seoData, location.pathname]);
};

// Helper function to generate SEO data for different page types
export const generateSEOData = {
  product: (product: any): SEOData => ({
    title: `${product.title} - Buy Online at Kixora Sri Lanka`,
    description: `Shop ${product.title} at the best price in Sri Lanka. ${product.description || 'Premium quality with fast delivery and secure payment.'} Free shipping on orders over LKR 5,000.`,
    keywords: `${product.title}, buy ${product.title}, ${product.categories?.name || 'fashion'}, online shopping sri lanka, ${product.brands?.name || ''}`.toLowerCase(),
    type: 'product',
    image: (() => {
      // Find primary image first, then fallback to first image, then fallback to logo
      const primaryImage = product.product_images?.find((img: any) => img.is_primary);
      const displayImage = primaryImage || product.product_images?.[0];

      return displayImage?.storage_path
        ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/kixora/${displayImage.storage_path}`
        : '/logo.white.png';
    })(),
    canonical: `/products/${product.slug || product.id}`
  }),

  collection: (collection: any): SEOData => ({
    title: `${collection.name} Collection - Kixora Sri Lanka`,
    description: `Discover our ${collection.name} collection. ${collection.description || 'Premium fashion and lifestyle products with exclusive designs.'} Shop now with secure payment and fast delivery.`,
    keywords: `${collection.name}, ${collection.name} collection, fashion collection, online shopping sri lanka`.toLowerCase(),
    type: 'website',
    image: collection.image_url || '/logo.white.png',
    canonical: `/collections/${collection.slug || collection.id}`
  }),

  category: (category: any): SEOData => ({
    title: `${category.name} - Shop Online at Kixora Sri Lanka`,
    description: `Browse our ${category.name} collection. ${category.description || 'Premium quality products with the latest trends.'} Free shipping on orders over LKR 5,000.`,
    keywords: `${category.name}, ${category.name} online, buy ${category.name}, fashion, online shopping sri lanka`.toLowerCase(),
    type: 'website',
    image: category.image_url || '/logo.white.png',
    canonical: `/categories/${category.slug || category.id}`
  }),

  home: (): SEOData => ({
    title: 'Kixora - Premium Fashion & Lifestyle Online Store Sri Lanka',
    description: 'Shop the latest fashion trends and premium lifestyle products at Kixora. Secure online shopping with fast delivery across Sri Lanka. Free shipping on orders over LKR 15,000.',
    keywords: 'online shopping sri lanka, fashion store, lifestyle products, premium brands, secure payment, fast delivery, kixora',
    type: 'website',
    canonical: '/'
  })
};