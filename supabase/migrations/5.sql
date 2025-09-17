-- Drop all existing seed data
DELETE FROM collection_products;
DELETE FROM collections;
DELETE FROM product_images;
DELETE FROM product_variants;
DELETE FROM products;
DELETE FROM brands;
DELETE FROM categories;

/*
  # Fresh Seed Data for E-commerce Platform

  Clean, correct seed data for:
  1. Categories (clothing and footwear)
  2. Brands (premium and popular brands)
  3. Products (diverse product range)
  4. Product variants (color variations with stock)
  5. Product images
  6. Collections for marketing
  7. Collection product associations

  Note: Designed for a modern Sri Lankan fashion and footwear store
*/

-- =====================================================
-- CATEGORIES
-- =====================================================

INSERT INTO categories (slug, name, description, is_pinned, display_order) VALUES
  ('sneakers', 'Sneakers', 'Trendy and comfortable sneakers for everyday wear', true, 1),
  ('t-shirts', 'T-Shirts', 'Casual and comfortable t-shirts for all occasions', false, 2),
  ('jeans', 'Jeans', 'Stylish denim jeans for men and women', false, 3),
  ('hoodies', 'Hoodies', 'Warm and cozy hoodies perfect for casual wear', false, 4),
  ('accessories', 'Accessories', 'Fashion accessories to complete your look', false, 5)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- BRANDS
-- =====================================================

INSERT INTO brands (slug, name, description) VALUES
  ('nike', 'Nike', 'Just Do It - Leading athletic and lifestyle brand'),
  ('adidas', 'Adidas', 'Impossible is Nothing - Premium sports and lifestyle brand'),
  ('zara', 'Zara', 'Fast fashion retail brand known for trendy clothing'),
  ('h-and-m', 'H&M', 'Swedish multinational clothing-retail company'),
  ('uniqlo', 'Uniqlo', 'Japanese casual wear designer and retailer')
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- PRODUCTS
-- =====================================================

-- Nike Sneakers
INSERT INTO products (sku, title, description, price, currency, category_id, brand_id, is_active, featured, return_policy)
SELECT 'NK-SNK-001', 'Nike Air Max 270', 'The Nike Air Max 270 delivers visible comfort with large Air unit and soft foam for all-day wearability.', 24500.00, 'LKR', c.id, b.id, true, true, '30-day return policy with original packaging'
FROM categories c, brands b
WHERE c.slug = 'sneakers' AND b.slug = 'nike'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO products (sku, title, description, price, currency, category_id, brand_id, is_active, featured, return_policy)
SELECT 'NK-SNK-002', 'Nike Dunk Low', 'Classic basketball shoe with premium materials and vintage appeal. Perfect for streetwear styling.', 19500.00, 'LKR', c.id, b.id, true, false, '30-day return policy with original packaging'
FROM categories c, brands b
WHERE c.slug = 'sneakers' AND b.slug = 'nike'
ON CONFLICT (sku) DO NOTHING;

-- Adidas Sneakers
INSERT INTO products (sku, title, description, price, currency, category_id, brand_id, is_active, featured, return_policy)
SELECT 'AD-SNK-001', 'Adidas Stan Smith', 'The legendary tennis shoe that became a global icon. Clean, minimal design with premium leather upper.', 16500.00, 'LKR', c.id, b.id, true, true, '30-day return policy with original packaging'
FROM categories c, brands b
WHERE c.slug = 'sneakers' AND b.slug = 'adidas'
ON CONFLICT (sku) DO NOTHING;

-- Zara T-Shirts
INSERT INTO products (sku, title, description, price, currency, category_id, brand_id, is_active, featured, return_policy)
SELECT 'ZR-TSH-001', 'Basic Cotton T-Shirt', 'Essential cotton t-shirt with regular fit. Made from 100% organic cotton for ultimate comfort.', 2500.00, 'LKR', c.id, b.id, true, false, '14-day return policy with tags attached'
FROM categories c, brands b
WHERE c.slug = 't-shirts' AND b.slug = 'zara'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO products (sku, title, description, price, currency, category_id, brand_id, is_active, featured, return_policy)
SELECT 'ZR-TSH-002', 'Oversized Graphic Tee', 'Trendy oversized fit t-shirt with bold graphic print. Perfect for casual street style looks.', 3200.00, 'LKR', c.id, b.id, true, true, '14-day return policy with tags attached'
FROM categories c, brands b
WHERE c.slug = 't-shirts' AND b.slug = 'zara'
ON CONFLICT (sku) DO NOTHING;

-- H&M Jeans
INSERT INTO products (sku, title, description, price, currency, category_id, brand_id, is_active, featured, return_policy)
SELECT 'HM-JNS-001', 'Slim Fit Denim Jeans', 'Classic slim fit jeans in premium stretch denim. Comfortable and stylish for everyday wear.', 4500.00, 'LKR', c.id, b.id, true, true, '30-day return policy with receipt'
FROM categories c, brands b
WHERE c.slug = 'jeans' AND b.slug = 'h-and-m'
ON CONFLICT (sku) DO NOTHING;

-- Uniqlo Hoodies
INSERT INTO products (sku, title, description, price, currency, category_id, brand_id, is_active, featured, return_policy)
SELECT 'UQ-HOD-001', 'Airism Cotton Hoodie', 'Lightweight hoodie with Airism technology for moisture-wicking comfort. Perfect for layering.', 6500.00, 'LKR', c.id, b.id, true, false, '30-day return policy with receipt'
FROM categories c, brands b
WHERE c.slug = 'hoodies' AND b.slug = 'uniqlo'
ON CONFLICT (sku) DO NOTHING;

-- =====================================================
-- PRODUCT VARIANTS
-- =====================================================

-- Nike Air Max 270 variants
INSERT INTO product_variants (product_id, sku, size, color, price_override, stock, is_active)
SELECT p.id, 'NK-SNK-001-BK', NULL, 'Black', NULL, 25, true
FROM products p WHERE p.sku = 'NK-SNK-001'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product_variants (product_id, sku, size, color, price_override, stock, is_active)
SELECT p.id, 'NK-SNK-001-WH', NULL, 'White', NULL, 30, true
FROM products p WHERE p.sku = 'NK-SNK-001'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product_variants (product_id, sku, size, color, price_override, stock, is_active)
SELECT p.id, 'NK-SNK-001-GY', NULL, 'Grey', NULL, 20, true
FROM products p WHERE p.sku = 'NK-SNK-001'
ON CONFLICT (sku) DO NOTHING;

-- Nike Dunk Low variants
INSERT INTO product_variants (product_id, sku, size, color, price_override, stock, is_active)
SELECT p.id, 'NK-SNK-002-WH', NULL, 'White', NULL, 15, true
FROM products p WHERE p.sku = 'NK-SNK-002'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product_variants (product_id, sku, size, color, price_override, stock, is_active)
SELECT p.id, 'NK-SNK-002-BK', NULL, 'Black', NULL, 18, true
FROM products p WHERE p.sku = 'NK-SNK-002'
ON CONFLICT (sku) DO NOTHING;

-- Adidas Stan Smith variants
INSERT INTO product_variants (product_id, sku, size, color, price_override, stock, is_active)
SELECT p.id, 'AD-SNK-001-WH', NULL, 'White', NULL, 35, true
FROM products p WHERE p.sku = 'AD-SNK-001'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product_variants (product_id, sku, size, color, price_override, stock, is_active)
SELECT p.id, 'AD-SNK-001-GN', NULL, 'Green', NULL, 25, true
FROM products p WHERE p.sku = 'AD-SNK-001'
ON CONFLICT (sku) DO NOTHING;

-- Zara Basic T-Shirt variants
INSERT INTO product_variants (product_id, sku, size, color, price_override, stock, is_active)
SELECT p.id, 'ZR-TSH-001-WH', NULL, 'White', NULL, 50, true
FROM products p WHERE p.sku = 'ZR-TSH-001'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product_variants (product_id, sku, size, color, price_override, stock, is_active)
SELECT p.id, 'ZR-TSH-001-BK', NULL, 'Black', NULL, 40, true
FROM products p WHERE p.sku = 'ZR-TSH-001'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product_variants (product_id, sku, size, color, price_override, stock, is_active)
SELECT p.id, 'ZR-TSH-001-NV', NULL, 'Navy', NULL, 35, true
FROM products p WHERE p.sku = 'ZR-TSH-001'
ON CONFLICT (sku) DO NOTHING;

-- Zara Graphic Tee variants
INSERT INTO product_variants (product_id, sku, size, color, price_override, stock, is_active)
SELECT p.id, 'ZR-TSH-002-BK', NULL, 'Black', NULL, 30, true
FROM products p WHERE p.sku = 'ZR-TSH-002'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product_variants (product_id, sku, size, color, price_override, stock, is_active)
SELECT p.id, 'ZR-TSH-002-WH', NULL, 'White', NULL, 28, true
FROM products p WHERE p.sku = 'ZR-TSH-002'
ON CONFLICT (sku) DO NOTHING;

-- H&M Jeans variants
INSERT INTO product_variants (product_id, sku, size, color, price_override, stock, is_active)
SELECT p.id, 'HM-JNS-001-BL', NULL, 'Blue', NULL, 22, true
FROM products p WHERE p.sku = 'HM-JNS-001'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product_variants (product_id, sku, size, color, price_override, stock, is_active)
SELECT p.id, 'HM-JNS-001-BK', NULL, 'Black', NULL, 18, true
FROM products p WHERE p.sku = 'HM-JNS-001'
ON CONFLICT (sku) DO NOTHING;

-- Uniqlo Hoodie variants
INSERT INTO product_variants (product_id, sku, size, color, price_override, stock, is_active)
SELECT p.id, 'UQ-HOD-001-GY', NULL, 'Grey', NULL, 15, true
FROM products p WHERE p.sku = 'UQ-HOD-001'
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product_variants (product_id, sku, size, color, price_override, stock, is_active)
SELECT p.id, 'UQ-HOD-001-NV', NULL, 'Navy', NULL, 12, true
FROM products p WHERE p.sku = 'UQ-HOD-001'
ON CONFLICT (sku) DO NOTHING;

-- =====================================================
-- PRODUCT IMAGES
-- =====================================================

-- Nike Air Max 270 images
INSERT INTO product_images (product_id, storage_path, alt_text, display_order, is_primary)
SELECT p.id, 'nike-air-max-270-black.jpg', 'Nike Air Max 270 Black', 1, true
FROM products p WHERE p.sku = 'NK-SNK-001'
ON CONFLICT DO NOTHING;

-- Nike Dunk Low images
INSERT INTO product_images (product_id, storage_path, alt_text, display_order, is_primary)
SELECT p.id, 'nike-dunk-low-white.jpg', 'Nike Dunk Low White', 1, true
FROM products p WHERE p.sku = 'NK-SNK-002'
ON CONFLICT DO NOTHING;

-- Adidas Stan Smith images
INSERT INTO product_images (product_id, storage_path, alt_text, display_order, is_primary)
SELECT p.id, 'adidas-stan-smith-white.jpg', 'Adidas Stan Smith White', 1, true
FROM products p WHERE p.sku = 'AD-SNK-001'
ON CONFLICT DO NOTHING;

-- Zara T-Shirt images
INSERT INTO product_images (product_id, storage_path, alt_text, display_order, is_primary)
SELECT p.id, 'zara-basic-tshirt-white.jpg', 'Zara Basic T-Shirt White', 1, true
FROM products p WHERE p.sku = 'ZR-TSH-001'
ON CONFLICT DO NOTHING;

INSERT INTO product_images (product_id, storage_path, alt_text, display_order, is_primary)
SELECT p.id, 'zara-graphic-tee-black.jpg', 'Zara Graphic Tee Black', 1, true
FROM products p WHERE p.sku = 'ZR-TSH-002'
ON CONFLICT DO NOTHING;

-- H&M Jeans images
INSERT INTO product_images (product_id, storage_path, alt_text, display_order, is_primary)
SELECT p.id, 'hm-slim-jeans-blue.jpg', 'H&M Slim Fit Jeans Blue', 1, true
FROM products p WHERE p.sku = 'HM-JNS-001'
ON CONFLICT DO NOTHING;

-- Uniqlo Hoodie images
INSERT INTO product_images (product_id, storage_path, alt_text, display_order, is_primary)
SELECT p.id, 'uniqlo-hoodie-grey.jpg', 'Uniqlo Cotton Hoodie Grey', 1, true
FROM products p WHERE p.sku = 'UQ-HOD-001'
ON CONFLICT DO NOTHING;

-- =====================================================
-- COLLECTIONS
-- =====================================================

INSERT INTO collections (slug, name, description, image_url, is_active, is_pinned, display_order) VALUES
  ('trending-now', 'Trending Now', 'The hottest items everyone is talking about', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop', true, true, 1),
  ('new-arrivals', 'New Arrivals', 'Fresh styles just landed in our store', 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=400&fit=crop', true, false, 2),
  ('bestsellers', 'Best Sellers', 'Customer favorites that keep selling out', 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=400&fit=crop', true, false, 3),
  ('streetwear', 'Streetwear', 'Urban fashion for the modern lifestyle', 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&h=400&fit=crop', true, false, 4)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- COLLECTION PRODUCTS
-- =====================================================

-- Trending Now collection
INSERT INTO collection_products (collection_id, product_id, display_order)
SELECT c.id, p.id, 1
FROM collections c, products p
WHERE c.slug = 'trending-now' AND p.sku = 'NK-SNK-001'
ON CONFLICT (collection_id, product_id) DO NOTHING;

INSERT INTO collection_products (collection_id, product_id, display_order)
SELECT c.id, p.id, 2
FROM collections c, products p
WHERE c.slug = 'trending-now' AND p.sku = 'ZR-TSH-002'
ON CONFLICT (collection_id, product_id) DO NOTHING;

INSERT INTO collection_products (collection_id, product_id, display_order)
SELECT c.id, p.id, 3
FROM collections c, products p
WHERE c.slug = 'trending-now' AND p.sku = 'HM-JNS-001'
ON CONFLICT (collection_id, product_id) DO NOTHING;

-- New Arrivals collection
INSERT INTO collection_products (collection_id, product_id, display_order)
SELECT c.id, p.id, 1
FROM collections c, products p
WHERE c.slug = 'new-arrivals' AND p.sku = 'NK-SNK-002'
ON CONFLICT (collection_id, product_id) DO NOTHING;

INSERT INTO collection_products (collection_id, product_id, display_order)
SELECT c.id, p.id, 2
FROM collections c, products p
WHERE c.slug = 'new-arrivals' AND p.sku = 'UQ-HOD-001'
ON CONFLICT (collection_id, product_id) DO NOTHING;

-- Best Sellers collection
INSERT INTO collection_products (collection_id, product_id, display_order)
SELECT c.id, p.id, 1
FROM collections c, products p
WHERE c.slug = 'bestsellers' AND p.sku = 'AD-SNK-001'
ON CONFLICT (collection_id, product_id) DO NOTHING;

INSERT INTO collection_products (collection_id, product_id, display_order)
SELECT c.id, p.id, 2
FROM collections c, products p
WHERE c.slug = 'bestsellers' AND p.sku = 'ZR-TSH-001'
ON CONFLICT (collection_id, product_id) DO NOTHING;

-- Streetwear collection
INSERT INTO collection_products (collection_id, product_id, display_order)
SELECT c.id, p.id, 1
FROM collections c, products p
WHERE c.slug = 'streetwear' AND p.sku = 'NK-SNK-001'
ON CONFLICT (collection_id, product_id) DO NOTHING;

INSERT INTO collection_products (collection_id, product_id, display_order)
SELECT c.id, p.id, 2
FROM collections c, products p
WHERE c.slug = 'streetwear' AND p.sku = 'NK-SNK-002'
ON CONFLICT (collection_id, product_id) DO NOTHING;

INSERT INTO collection_products (collection_id, product_id, display_order)
SELECT c.id, p.id, 3
FROM collections c, products p
WHERE c.slug = 'streetwear' AND p.sku = 'ZR-TSH-002'
ON CONFLICT (collection_id, product_id) DO NOTHING;