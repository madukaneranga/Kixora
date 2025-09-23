import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  slug: string;
  product_images?: Array<{
    storage_path: string;
    alt_text: string | null;
  }>;
  categories?: {
    name: string;
  };
}

interface Collection {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  image_url: string | null;
}

const isCrawler = (userAgent: string): boolean => {
  const crawlerPatterns = [
    'facebookexternalhit',
    'Twitterbot',
    'WhatsApp',
    'linkedinbot',
    'telegrambot',
    'discordbot',
    'slackbot',
    'skypebot',
    'googlebot',
    'bingbot',
    'yandexbot',
    'pinterest',
    'applebot',
    'redditbot'
  ];

  return crawlerPatterns.some(pattern =>
    userAgent.toLowerCase().includes(pattern.toLowerCase())
  );
};

const generateProductHTML = (product: Product, siteUrl: string): string => {
  const imageUrl = product.product_images?.[0]?.storage_path
    ? `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/kixora/${product.product_images[0].storage_path}`
    : `${siteUrl}/logo.white.png`;

  const description = product.description
    ? product.description.substring(0, 160) + (product.description.length > 160 ? '...' : '')
    : `Shop ${product.title} at Kixora. Premium quality at LKR ${product.price.toLocaleString()}.`;

  const title = `${product.title} - Kixora`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Basic Meta Tags -->
  <title>${title}</title>
  <meta name="description" content="${description}">

  <!-- Open Graph Tags -->
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:url" content="${siteUrl}/products/${product.slug}">
  <meta property="og:type" content="product">
  <meta property="og:site_name" content="Kixora">
  <meta property="og:locale" content="en_US">

  <!-- Product-specific Open Graph -->
  <meta property="product:price:amount" content="${product.price}">
  <meta property="product:price:currency" content="LKR">
  <meta property="product:availability" content="in stock">
  <meta property="product:condition" content="new">
  <meta property="product:retailer_item_id" content="${product.id}">
  ${product.categories ? `<meta property="product:category" content="${product.categories.name}">` : ''}

  <!-- Twitter Card Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl}">

  <!-- WhatsApp specific -->
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/jpeg">

  <!-- Redirect to React app -->
  <script>
    if (!/bot|crawler|spider|crawling/i.test(navigator.userAgent)) {
      window.location.href = "${siteUrl}/products/${product.slug}";
    }
  </script>
</head>
<body>
  <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
    <h1>${product.title}</h1>
    <img src="${imageUrl}" alt="${product.title}" style="max-width: 400px; height: auto;">
    <p>${description}</p>
    <p style="font-size: 24px; font-weight: bold;">LKR ${product.price.toLocaleString()}</p>
    <a href="${siteUrl}/products/${product.slug}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px;">View Product</a>
  </div>
</body>
</html>`;
};

const generateCollectionHTML = (collection: Collection, siteUrl: string): string => {
  const imageUrl = collection.image_url
    ? `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/kixora/${collection.image_url}`
    : `${siteUrl}/logo.white.png`;

  const description = collection.description
    ? collection.description.substring(0, 160) + (collection.description.length > 160 ? '...' : '')
    : `Explore ${collection.name} collection at Kixora. Premium fashion and lifestyle products.`;

  const title = `${collection.name} Collection - Kixora`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Basic Meta Tags -->
  <title>${title}</title>
  <meta name="description" content="${description}">

  <!-- Open Graph Tags -->
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:url" content="${siteUrl}/collections/${collection.slug}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Kixora">
  <meta property="og:locale" content="en_US">

  <!-- Twitter Card Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl}">

  <!-- WhatsApp specific -->
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/jpeg">

  <!-- Redirect to React app -->
  <script>
    if (!/bot|crawler|spider|crawling/i.test(navigator.userAgent)) {
      window.location.href = "${siteUrl}/collections/${collection.slug}";
    }
  </script>
</head>
<body>
  <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
    <h1>${collection.name}</h1>
    <img src="${imageUrl}" alt="${collection.name}" style="max-width: 400px; height: auto;">
    <p>${description}</p>
    <a href="${siteUrl}/collections/${collection.slug}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px;">View Collection</a>
  </div>
</body>
</html>`;
};

const getDefaultHTML = (siteUrl: string): string => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Basic Meta Tags -->
  <title>Kixora - Premium Fashion & Lifestyle Online Store Sri Lanka</title>
  <meta name="description" content="Shop the latest fashion trends and premium lifestyle products at Kixora. Secure online shopping with fast delivery across Sri Lanka.">

  <!-- Open Graph Tags -->
  <meta property="og:title" content="Kixora - Premium Fashion & Lifestyle Online Store Sri Lanka">
  <meta property="og:description" content="Shop the latest fashion trends and premium lifestyle products at Kixora. Secure online shopping with fast delivery across Sri Lanka.">
  <meta property="og:image" content="${siteUrl}/logo.white.png">
  <meta property="og:url" content="${siteUrl}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Kixora">
  <meta property="og:locale" content="en_US">

  <!-- Twitter Card Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Kixora - Premium Fashion & Lifestyle Online Store Sri Lanka">
  <meta name="twitter:description" content="Shop the latest fashion trends and premium lifestyle products at Kixora. Secure online shopping with fast delivery across Sri Lanka.">
  <meta name="twitter:image" content="${siteUrl}/logo.white.png">

  <!-- Redirect to React app -->
  <script>
    if (!/bot|crawler|spider|crawling/i.test(navigator.userAgent)) {
      window.location.href = "${siteUrl}";
    }
  </script>
</head>
<body>
  <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
    <h1>Kixora</h1>
    <img src="${siteUrl}/logo.white.png" alt="Kixora" style="max-width: 200px; height: auto;">
    <p>Premium Fashion & Lifestyle Online Store Sri Lanka</p>
    <a href="${siteUrl}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Visit Store</a>
  </div>
</body>
</html>`;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    const userAgent = req.headers.get('user-agent') || '';
    const siteUrl = url.origin.replace('supabase.co', 'inkixora.com'); // Adjust this to your actual domain

    // Only handle crawler requests
    if (!isCrawler(userAgent)) {
      return new Response(getDefaultHTML(siteUrl), {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const pathname = url.pathname;

    // Handle product pages
    if (pathname.startsWith('/products/')) {
      const slug = pathname.split('/products/')[1];

      if (slug) {
        const { data: product, error } = await supabase
          .from('products')
          .select(`
            id,
            title,
            description,
            price,
            slug,
            product_images (
              storage_path,
              alt_text
            ),
            categories (
              name
            )
          `)
          .eq('slug', slug)
          .eq('is_active', true)
          .is('deleted_at', null)
          .single();

        if (error || !product) {
          return new Response(getDefaultHTML(siteUrl), {
            headers: { ...corsHeaders, 'Content-Type': 'text/html' },
          });
        }

        return new Response(generateProductHTML(product, siteUrl), {
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        });
      }
    }

    // Handle collection pages
    if (pathname.startsWith('/collections/')) {
      const slug = pathname.split('/collections/')[1];

      if (slug) {
        const { data: collection, error } = await supabase
          .from('collections')
          .select('id, name, description, slug, image_url')
          .eq('slug', slug)
          .eq('is_active', true)
          .single();

        if (error || !collection) {
          return new Response(getDefaultHTML(siteUrl), {
            headers: { ...corsHeaders, 'Content-Type': 'text/html' },
          });
        }

        return new Response(generateCollectionHTML(collection, siteUrl), {
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        });
      }
    }

    // Default response for any other route
    return new Response(getDefaultHTML(siteUrl), {
      headers: { ...corsHeaders, 'Content-Type': 'text/html' },
    });

  } catch (error) {
    console.error('Error in meta-handler:', error);

    return new Response(getDefaultHTML('https://www.inkixora.com'), {
      headers: { ...corsHeaders, 'Content-Type': 'text/html' },
    });
  }
})