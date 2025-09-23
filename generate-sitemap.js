// Simple Node.js script to generate sitemap.xml
// Run this with: node generate-sitemap.js

const fs = require('fs');
const path = require('path');

// Mock the generateSitemap function for Node.js environment
async function generateSitemap() {
  const baseUrl = 'https://www.inkixora.com';

  // You'll need to replace this with actual data from your database
  // For now, this is a basic template
  const urls = [
    { loc: `${baseUrl}/`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: '1.0' },
    { loc: `${baseUrl}/products`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: '0.9' },
    { loc: `${baseUrl}/collections`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: '0.9' },
    { loc: `${baseUrl}/contact`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.8' },
    { loc: `${baseUrl}/faq`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: '0.7' },
    { loc: `${baseUrl}/privacy-policy`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'yearly', priority: '0.5' },
    { loc: `${baseUrl}/terms-of-service`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'yearly', priority: '0.5' },
    { loc: `${baseUrl}/refund-policy`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'yearly', priority: '0.5' },
  ];

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
}

async function main() {
  try {
    console.log('Generating sitemap...');
    const sitemapContent = await generateSitemap();

    // Write to public folder
    const publicPath = path.join(__dirname, 'public', 'sitemap.xml');
    fs.writeFileSync(publicPath, sitemapContent);

    console.log('✅ Sitemap generated successfully at public/sitemap.xml');
    console.log('📝 Remember to update with actual product/collection data from your database');
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
  }
}

main();