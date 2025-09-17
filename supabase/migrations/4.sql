/*
  # Seed Data for eCommerce Platform

  Creates sample data for testing and demonstration:
  1. Product Categories
  2. Brands
  3. Sample Products with variants
  4. Product Images
  5. Collections
  6. Collection Products

  All inserts use ON CONFLICT DO NOTHING for safe re-running.
*/

-- =====================================================
-- CATEGORIES
-- =====================================================

INSERT INTO categories (slug, name, description, image_url, is_pinned, display_order) VALUES
  ('running', 'Running Shoes', 'High-performance running shoes for all terrains', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=300&fit=crop', true, 1),
  ('training', 'Training Shoes', 'Versatile shoes for gym and cross-training', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=300&fit=crop', true, 2),
  ('lifestyle', 'Lifestyle Sneakers', 'Casual sneakers for everyday wear', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&h=300&fit=crop', true, 3),
  ('basketball', 'Basketball Shoes', 'Professional basketball footwear', 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=500&h=300&fit=crop', false, 4),
  ('soccer', 'Soccer Cleats', 'Professional soccer boots and cleats', 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=500&h=300&fit=crop', false, 5)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- BRANDS
-- =====================================================

INSERT INTO brands (slug, name, description, logo_url) VALUES
  ('nike', 'Nike', 'Just Do It - Leading athletic footwear brand', 'https://logo.clearbit.com/nike.com'),
  ('adidas', 'Adidas', 'Impossible is Nothing - German multinational footwear corporation', 'https://logo.clearbit.com/adidas.com'),
  ('puma', 'Puma', 'Forever Faster - German multinational athletic footwear company', 'https://logo.clearbit.com/puma.com'),
  ('new-balance', 'New Balance', 'Endorsed by No One - American footwear manufacturer', 'https://logo.clearbit.com/newbalance.com'),
  ('asics', 'ASICS', 'Sound Mind, Sound Body - Japanese multinational athletic equipment company', 'https://logo.clearbit.com/asics.com')
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- PRODUCTS
-- =====================================================

-- Nike Running Shoes
INSERT INTO products (sku, title, description, price, category_id, brand_id, is_featured, return_policy)
SELECT
  'NK-RUN-001',
  'Nike Air Zoom Pegasus 40',
  'Experience the legendary ride that''s loved by runners everywhere. The Nike Air Zoom Pegasus 40 features responsive cushioning with a smooth, springy feel.',
  16500.00,
  c.id,
  b.id,
  true,
  'Free returns within 30 days of purchase'
FROM categories c, brands b WHERE c.slug = 'running' AND b.slug = 'nike';

INSERT INTO products (sku, title, description, price, category_id, brand_id, is_featured, return_policy)
SELECT
  'NK-RUN-002',
  'Nike React Infinity Run Flyknit 3',
  'Keep running with the Nike React Infinity Run Flyknit 3. Still one of our most tested shoes, it''s designed to help reduce injury.',
  18500.00,
  c.id,
  b.id,
  true,
  'Free returns within 30 days of purchase'
FROM categories c, brands b WHERE c.slug = 'running' AND b.slug = 'nike';

-- Adidas Running Shoes
INSERT INTO products (sku, title, description, price, category_id, brand_id, is_featured, return_policy)
SELECT
  'AD-RUN-001',
  'Adidas Ultraboost 23',
  'Feel the energy return with every step. These running shoes feature responsive BOOST midsole technology.',
  22500.00,
  c.id,
  b.id,
  true,
  '100-day return policy'
FROM categories c, brands b WHERE c.slug = 'running' AND b.slug = 'adidas';

-- Nike Training Shoes
INSERT INTO products (sku, title, description, price, category_id, brand_id, is_featured, return_policy)
SELECT
  'NK-TRN-001',
  'Nike Metcon 9',
  'Take on intense workouts with the Nike Metcon 9. Designed for stability and durability during your toughest training sessions.',
  17500.00,
  c.id,
  b.id,
  false,
  'Free returns within 30 days of purchase'
FROM categories c, brands b WHERE c.slug = 'training' AND b.slug = 'nike';

-- Lifestyle Sneakers
INSERT INTO products (sku, title, description, price, category_id, brand_id, is_featured, return_policy)
SELECT
  'NK-LST-001',
  'Nike Air Force 1 ''07',
  'The classic basketball shoe that started it all. Clean, simple, and timeless design that goes with everything.',
  14500.00,
  c.id,
  b.id,
  true,
  'Free returns within 30 days of purchase'
FROM categories c, brands b WHERE c.slug = 'lifestyle' AND b.slug = 'nike';

INSERT INTO products (sku, title, description, price, category_id, brand_id, is_featured, return_policy)
SELECT
  'AD-LST-001',
  'Adidas Stan Smith',
  'The most successful tennis shoe ever. Clean, minimalist design with premium leather construction.',
  12500.00,
  c.id,
  b.id,
  true,
  '100-day return policy'
FROM categories c, brands b WHERE c.slug = 'lifestyle' AND b.slug = 'adidas'
ON CONFLICT (sku) DO NOTHING;

-- =====================================================
-- PRODUCT VARIANTS
-- =====================================================

-- Nike Air Zoom Pegasus 40 variants
INSERT INTO product_variants (product_id, sku, size, color, stock)
SELECT p.id, 'NK-RUN-001-BLK-40', '40', 'Black', 25
FROM products p WHERE p.sku = 'NK-RUN-001';

INSERT INTO product_variants (product_id, sku, size, color, stock)
SELECT p.id, 'NK-RUN-001-BLK-41', '41', 'Black', 30
FROM products p WHERE p.sku = 'NK-RUN-001';

INSERT INTO product_variants (product_id, sku, size, color, stock)
SELECT p.id, 'NK-RUN-001-BLK-42', '42', 'Black', 35
FROM products p WHERE p.sku = 'NK-RUN-001';

INSERT INTO product_variants (product_id, sku, size, color, stock)
SELECT p.id, 'NK-RUN-001-WHT-40', '40', 'White', 20
FROM products p WHERE p.sku = 'NK-RUN-001';

INSERT INTO product_variants (product_id, sku, size, color, stock)
SELECT p.id, 'NK-RUN-001-WHT-41', '41', 'White', 28
FROM products p WHERE p.sku = 'NK-RUN-001';

INSERT INTO product_variants (product_id, sku, size, color, stock)
SELECT p.id, 'NK-RUN-001-WHT-42', '42', 'White', 32
FROM products p WHERE p.sku = 'NK-RUN-001';

-- Nike React Infinity variants
INSERT INTO product_variants (product_id, sku, size, color, stock)
SELECT p.id, 'NK-RUN-002-BLU-40', '40', 'Blue', 22
FROM products p WHERE p.sku = 'NK-RUN-002';

INSERT INTO product_variants (product_id, sku, size, color, stock)
SELECT p.id, 'NK-RUN-002-BLU-41', '41', 'Blue', 26
FROM products p WHERE p.sku = 'NK-RUN-002';

INSERT INTO product_variants (product_id, sku, size, color, stock)
SELECT p.id, 'NK-RUN-002-BLU-42', '42', 'Blue', 30
FROM products p WHERE p.sku = 'NK-RUN-002';

-- Adidas Ultraboost variants
INSERT INTO product_variants (product_id, sku, size, color, stock)
SELECT p.id, 'AD-RUN-001-BLK-40', '40', 'Black', 18
FROM products p WHERE p.sku = 'AD-RUN-001';

INSERT INTO product_variants (product_id, sku, size, color, stock)
SELECT p.id, 'AD-RUN-001-BLK-41', '41', 'Black', 24
FROM products p WHERE p.sku = 'AD-RUN-001';

INSERT INTO product_variants (product_id, sku, size, color, stock)
SELECT p.id, 'AD-RUN-001-BLK-42', '42', 'Black', 28
FROM products p WHERE p.sku = 'AD-RUN-001';

-- Nike Metcon variants
INSERT INTO product_variants (product_id, sku, size, color, stock)
SELECT p.id, 'NK-TRN-001-GRY-40', '40', 'Grey', 15
FROM products p WHERE p.sku = 'NK-TRN-001';

INSERT INTO product_variants (product_id, sku, size, color, stock)
SELECT p.id, 'NK-TRN-001-GRY-41', '41', 'Grey', 20
FROM products p WHERE p.sku = 'NK-TRN-001';

INSERT INTO product_variants (product_id, sku, size, color, stock)
SELECT p.id, 'NK-TRN-001-GRY-42', '42', 'Grey', 25
FROM products p WHERE p.sku = 'NK-TRN-001';

-- Nike Air Force 1 variants
INSERT INTO product_variants (product_id, sku, size, color, stock)
SELECT p.id, 'NK-LST-001-WHT-40', '40', 'White', 40
FROM products p WHERE p.sku = 'NK-LST-001';

INSERT INTO product_variants (product_id, sku, size, color, stock)
SELECT p.id, 'NK-LST-001-WHT-41', '41', 'White', 45
FROM products p WHERE p.sku = 'NK-LST-001';

INSERT INTO product_variants (product_id, sku, size, color, stock)
SELECT p.id, 'NK-LST-001-WHT-42', '42', 'White', 50
FROM products p WHERE p.sku = 'NK-LST-001';

-- Adidas Stan Smith variants
INSERT INTO product_variants (product_id, sku, size, color, stock)
SELECT p.id, 'AD-LST-001-WHT-40', '40', 'White/Green', 35
FROM products p WHERE p.sku = 'AD-LST-001';

INSERT INTO product_variants (product_id, sku, size, color, stock)
SELECT p.id, 'AD-LST-001-WHT-41', '41', 'White/Green', 40
FROM products p WHERE p.sku = 'AD-LST-001';

INSERT INTO product_variants (product_id, sku, size, color, stock)
SELECT p.id, 'AD-LST-001-WHT-42', '42', 'White/Green', 42
FROM products p WHERE p.sku = 'AD-LST-001'
ON CONFLICT (sku) DO NOTHING;

-- =====================================================
-- PRODUCT IMAGES
-- =====================================================

-- Nike Air Zoom Pegasus 40 images
INSERT INTO product_images (product_id, storage_path, alt_text, display_order, is_primary)
SELECT p.id, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=600&fit=crop', 'Nike Air Zoom Pegasus 40 - Black colorway', 1, true
FROM products p WHERE p.sku = 'NK-RUN-001';

INSERT INTO product_images (product_id, storage_path, alt_text, display_order)
SELECT p.id, 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop', 'Nike Air Zoom Pegasus 40 - Side view', 2
FROM products p WHERE p.sku = 'NK-RUN-001';

-- Nike React Infinity Run images
INSERT INTO product_images (product_id, storage_path, alt_text, display_order, is_primary)
SELECT p.id, 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop', 'Nike React Infinity Run Flyknit 3', 1, true
FROM products p WHERE p.sku = 'NK-RUN-002';

-- Adidas Ultraboost images
INSERT INTO product_images (product_id, storage_path, alt_text, display_order, is_primary)
SELECT p.id, 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=800&h=600&fit=crop', 'Adidas Ultraboost 23', 1, true
FROM products p WHERE p.sku = 'AD-RUN-001';

-- Nike Metcon images
INSERT INTO product_images (product_id, storage_path, alt_text, display_order, is_primary)
SELECT p.id, 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=600&fit=crop', 'Nike Metcon 9 Training Shoes', 1, true
FROM products p WHERE p.sku = 'NK-TRN-001';

-- Nike Air Force 1 images
INSERT INTO product_images (product_id, storage_path, alt_text, display_order, is_primary)
SELECT p.id, 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop', 'Nike Air Force 1 07 White', 1, true
FROM products p WHERE p.sku = 'NK-LST-001';

-- Adidas Stan Smith images
INSERT INTO product_images (product_id, storage_path, alt_text, display_order, is_primary)
SELECT p.id, 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&h=600&fit=crop', 'Adidas Stan Smith Classic', 1, true
FROM products p WHERE p.sku = 'AD-LST-001'
ON CONFLICT DO NOTHING;

-- =====================================================
-- COLLECTIONS
-- =====================================================

INSERT INTO collections (slug, name, description, image_url, is_active, is_pinned, display_order) VALUES
  ('featured', 'Featured Products', 'Our hand-picked selection of the best running shoes', 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&h=400&fit=crop', true, true, 1),
  ('new-arrivals', 'New Arrivals', 'Latest products just added to our catalog', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=400&fit=crop', true, true, 2),
  ('bestsellers', 'Best Sellers', 'Most popular products among our customers', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop', true, true, 3),
  ('nike-collection', 'Nike Collection', 'Premium Nike footwear for athletes', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=400&fit=crop', true, false, 4)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- COLLECTION PRODUCTS
-- =====================================================

-- Featured collection products
INSERT INTO collection_products (collection_id, product_id, display_order)
SELECT c.id, p.id, 1
FROM collections c, products p
WHERE c.slug = 'featured' AND p.sku = 'NK-RUN-001';

INSERT INTO collection_products (collection_id, product_id, display_order)
SELECT c.id, p.id, 2
FROM collections c, products p
WHERE c.slug = 'featured' AND p.sku = 'AD-RUN-001';

INSERT INTO collection_products (collection_id, product_id, display_order)
SELECT c.id, p.id, 3
FROM collections c, products p
WHERE c.slug = 'featured' AND p.sku = 'NK-LST-001';

-- New arrivals collection
INSERT INTO collection_products (collection_id, product_id, display_order)
SELECT c.id, p.id, 1
FROM collections c, products p
WHERE c.slug = 'new-arrivals' AND p.sku = 'NK-RUN-002';

INSERT INTO collection_products (collection_id, product_id, display_order)
SELECT c.id, p.id, 2
FROM collections c, products p
WHERE c.slug = 'new-arrivals' AND p.sku = 'AD-LST-001';

-- Best sellers collection
INSERT INTO collection_products (collection_id, product_id, display_order)
SELECT c.id, p.id, 1
FROM collections c, products p
WHERE c.slug = 'bestsellers' AND p.sku = 'NK-LST-001';

INSERT INTO collection_products (collection_id, product_id, display_order)
SELECT c.id, p.id, 2
FROM collections c, products p
WHERE c.slug = 'bestsellers' AND p.sku = 'NK-RUN-001';

-- Nike collection
INSERT INTO collection_products (collection_id, product_id, display_order)
SELECT c.id, p.id, 1
FROM collections c, products p
WHERE c.slug = 'nike-collection' AND p.sku = 'NK-RUN-001';

INSERT INTO collection_products (collection_id, product_id, display_order)
SELECT c.id, p.id, 2
FROM collections c, products p
WHERE c.slug = 'nike-collection' AND p.sku = 'NK-RUN-002';

INSERT INTO collection_products (collection_id, product_id, display_order)
SELECT c.id, p.id, 3
FROM collections c, products p
WHERE c.slug = 'nike-collection' AND p.sku = 'NK-TRN-001';

INSERT INTO collection_products (collection_id, product_id, display_order)
SELECT c.id, p.id, 4
FROM collections c, products p
WHERE c.slug = 'nike-collection' AND p.sku = 'NK-LST-001'
ON CONFLICT (collection_id, product_id) DO NOTHING;