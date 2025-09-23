// Sitemap generator utility for SEO
import { supabase } from '../lib/supabase';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export const generateSitemap = async (): Promise<string> => {
  const baseUrl = 'https://inkixora.com'; // Your actual domain
  const urls: SitemapUrl[] = [];

  // Static pages
  const staticPages = [
    { loc: '/', changefreq: 'daily' as const, priority: 1.0 },
    { loc: '/collections', changefreq: 'daily' as const, priority: 0.9 },
    { loc: '/products', changefreq: 'daily' as const, priority: 0.9 },
    { loc: '/contact', changefreq: 'monthly' as const, priority: 0.8 },
    { loc: '/faq', changefreq: 'monthly' as const, priority: 0.7 },
    { loc: '/delivery', changefreq: 'monthly' as const, priority: 0.7 },
    { loc: '/privacy-policy', changefreq: 'yearly' as const, priority: 0.5 },
    { loc: '/terms-of-service', changefreq: 'yearly' as const, priority: 0.5 },
    { loc: '/refund-policy', changefreq: 'yearly' as const, priority: 0.5 },
    { loc: '/size-guide', changefreq: 'monthly' as const, priority: 0.6 }
  ];

  urls.push(...staticPages.map(page => ({
    ...page,
    loc: `${baseUrl}${page.loc}`,
    lastmod: new Date().toISOString().split('T')[0]
  })));

  try {
    // Fetch all active products
    const { data: products } = await supabase
      .from('products')
      .select('id, slug, updated_at')
      .eq('is_active', true)
      .is('deleted_at', null);

    if (products) {
      products.forEach(product => {
        urls.push({
          loc: `${baseUrl}/products/${product.slug || product.id}`,
          lastmod: new Date(product.updated_at).toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: 0.8
        });
      });
    }

    // Fetch all active collections
    const { data: collections } = await supabase
      .from('collections')
      .select('id, slug, updated_at')
      .eq('is_active', true);

    if (collections) {
      collections.forEach(collection => {
        urls.push({
          loc: `${baseUrl}/collections/${collection.slug || collection.id}`,
          lastmod: new Date(collection.updated_at).toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: 0.7
        });
      });
    }

    // Fetch all active categories
    const { data: categories } = await supabase
      .from('categories')
      .select('id, slug, updated_at')
      .eq('is_active', true);

    if (categories) {
      categories.forEach(category => {
        urls.push({
          loc: `${baseUrl}/products?category=${category.slug}`,
          lastmod: new Date(category.updated_at).toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: 0.7
        });
      });
    }

  } catch (error) {
    console.error('Error generating sitemap:', error);
  }

  // Generate XML sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return sitemap;
};

// Function to save sitemap to public folder (for build process)
export const saveSitemap = async () => {
  try {
    const sitemapContent = await generateSitemap();
    // In a real implementation, you'd write this to public/sitemap.xml
    // For now, we'll log it or return it for manual creation
    console.log('Generated sitemap:', sitemapContent);
    return sitemapContent;
  } catch (error) {
    console.error('Error saving sitemap:', error);
    throw error;
  }
};