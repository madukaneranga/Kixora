// Structured Data (JSON-LD) utilities for SEO
export interface StructuredDataProps {
  type: 'Organization' | 'Product' | 'BreadcrumbList' | 'WebSite' | 'LocalBusiness';
  data: any;
}

// Organization Schema for Kixora brand
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Kixora",
  "description": "Premium fashion and lifestyle online store in Sri Lanka",
  "url": "https://inkixora.com",
  "logo": "https://inkixora.com/logo.white.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+94741285920",
    "contactType": "Customer Service",
    "availableLanguage": ["English", "Sinhala"]
  },
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "LK",
    "addressRegion": "Western Province"
  },
  "sameAs": [
    "https://www.facebook.com/kixora",
    "https://www.instagram.com/kixora",
    "https://www.twitter.com/kixora"
  ],
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://inkixora.com/products?search={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

// Website Schema with search functionality
export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Kixora",
  "url": "https://inkixora.com",
  "description": "Premium fashion and lifestyle online store in Sri Lanka",
  "publisher": {
    "@type": "Organization",
    "name": "Kixora"
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://inkixora.com/products?search={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
};

// Product Schema Generator
export const generateProductSchema = (product: any) => {
  const baseUrl = window.location.origin;
  const productUrl = `${baseUrl}/products/${product.slug || product.id}`;
  const imageUrl = product.product_images?.[0]?.storage_path
    ? (product.product_images[0].storage_path.startsWith('http')
        ? product.product_images[0].storage_path
        : `${baseUrl}${product.product_images[0].storage_path}`)
    : `${baseUrl}/logo.white.png`;

  // Check if product has variants and calculate availability
  const hasVariants = product.product_variants && product.product_variants.length > 0;
  const inStock = hasVariants
    ? product.product_variants.some((variant: any) => variant.stock > 0 && variant.is_active)
    : true;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title,
    "description": product.description || `Premium ${product.title} available at Kixora Sri Lanka`,
    "image": imageUrl,
    "url": productUrl,
    "sku": product.sku || product.id,
    "brand": {
      "@type": "Brand",
      "name": product.brands?.name || "Kixora"
    },
    "category": product.categories?.name || "Fashion",
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": product.currency || "LKR",
      "availability": inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "url": productUrl,
      "seller": {
        "@type": "Organization",
        "name": "Kixora"
      },
      "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": "0",
          "currency": "LKR"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 2,
            "unitCode": "DAY"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 2,
            "maxValue": 5,
            "unitCode": "DAY"
          }
        }
      }
    }
  };

  // Add aggregateRating if reviews exist (placeholder for future implementation)
  if (product.rating && product.reviewCount) {
    (schema as any).aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": product.rating,
      "reviewCount": product.reviewCount,
      "bestRating": "5",
      "worstRating": "1"
    };
  }

  return schema;
};

// Breadcrumb Schema Generator
export const generateBreadcrumbSchema = (breadcrumbs: Array<{name: string, url: string}>) => {
  const baseUrl = window.location.origin;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`
    }))
  };
};

// Collection Schema Generator
export const generateCollectionSchema = (collection: any) => {
  const baseUrl = window.location.origin;
  const collectionUrl = `${baseUrl}/collections/${collection.slug || collection.id}`;

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": collection.name,
    "description": collection.description || `Discover our ${collection.name} collection`,
    "url": collectionUrl,
    "image": collection.image_url || `${baseUrl}/logo.white.png`,
    "publisher": {
      "@type": "Organization",
      "name": "Kixora"
    },
    "mainEntity": {
      "@type": "ItemList",
      "name": `${collection.name} Products`,
      "description": `Products in ${collection.name} collection`
    }
  };
};

// Local Business Schema (if physical store exists)
export const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Kixora",
  "description": "Premium fashion and lifestyle store",
  "url": "https://inkixora.com",
  "telephone": "+94741285920",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "LK",
    "addressRegion": "Western Province"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "6.9271",
    "longitude": "79.8612"
  },
  "openingHours": "Mo-Sa 09:00-18:00",
  "paymentAccepted": "Cash, Credit Card, PayHere",
  "priceRange": "$$"
};

// Utility function to inject structured data into page
export const injectStructuredData = (schema: any, id?: string) => {
  const scriptId = id || 'structured-data';

  // Remove existing script if it exists
  const existingScript = document.getElementById(scriptId);
  if (existingScript) {
    existingScript.remove();
  }

  // Create and inject new script
  const script = document.createElement('script');
  script.id = scriptId;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
};

// Combined structured data injector for multiple schemas
export const injectMultipleStructuredData = (schemas: Array<{schema: any, id?: string}>) => {
  schemas.forEach(({schema, id}) => {
    injectStructuredData(schema, id);
  });
};