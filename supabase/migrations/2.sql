/*
  # Row Level Security Policies

  Enables RLS and creates policies for:
  1. User data access (profiles, carts, orders, wishlists)
  2. Public catalog access (products, categories, brands)
  3. Review system policies
  4. Admin access patterns

  Strategy: Simple, non-recursive policies to avoid infinite loops
*/

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PUBLIC CATALOG POLICIES (READ-ONLY FOR ALL USERS)
-- =====================================================

-- Categories: Public read access
CREATE POLICY "categories_public_read" ON categories
  FOR SELECT TO anon, authenticated
  USING (true);

-- Brands: Public read access
CREATE POLICY "brands_public_read" ON brands
  FOR SELECT TO anon, authenticated
  USING (true);

-- Products: Public read access for active products
CREATE POLICY "products_public_read" ON products
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Product variants: Public read access for active variants of active products
CREATE POLICY "variants_public_read" ON product_variants
  FOR SELECT TO anon, authenticated
  USING (
    is_active = true AND
    EXISTS (SELECT 1 FROM products WHERE id = product_id AND is_active = true)
  );

-- Product images: Public read access
CREATE POLICY "images_public_read" ON product_images
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM products WHERE id = product_id AND is_active = true)
  );

-- Collections: Public read access for active collections
CREATE POLICY "collections_public_read" ON collections
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- Collection products: Public read access
CREATE POLICY "collection_products_public_read" ON collection_products
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM collections WHERE id = collection_id AND is_active = true)
  );

-- =====================================================
-- USER DATA POLICIES (USERS ACCESS OWN DATA)
-- =====================================================

-- Profiles: Users can read/update their own profile
CREATE POLICY "profiles_own_access" ON profiles
  FOR ALL TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Wishlists: Users manage their own wishlists
CREATE POLICY "wishlists_own_access" ON wishlists
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Carts: Users manage their own carts
CREATE POLICY "carts_own_access" ON carts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Cart items: Users manage items in their own carts
CREATE POLICY "cart_items_own_access" ON cart_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE id = cart_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM carts
      WHERE id = cart_id AND user_id = auth.uid()
    )
  );

-- Orders: Users access their own orders
CREATE POLICY "orders_own_access" ON orders
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Order items: Users access items from their own orders
CREATE POLICY "order_items_own_access" ON order_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE id = order_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE id = order_id AND user_id = auth.uid()
    )
  );

-- =====================================================
-- REVIEW SYSTEM POLICIES
-- =====================================================

-- Reviews: Public read, users write/update their own
CREATE POLICY "reviews_public_read" ON reviews
  FOR SELECT TO anon, authenticated
  USING (is_approved = true);

CREATE POLICY "reviews_own_write" ON reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews_own_update" ON reviews
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews_own_delete" ON reviews
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);


-- =====================================================
-- GRANT TABLE PERMISSIONS
-- =====================================================

-- Grant access to authenticated users for their own data
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON wishlists TO authenticated;
GRANT ALL ON carts TO authenticated;
GRANT ALL ON cart_items TO authenticated;
GRANT ALL ON orders TO authenticated;
GRANT ALL ON order_items TO authenticated;
GRANT ALL ON reviews TO authenticated;

-- Grant read access to catalog tables for all users
GRANT SELECT ON categories TO anon, authenticated;
GRANT SELECT ON brands TO anon, authenticated;
GRANT SELECT ON products TO anon, authenticated;
GRANT SELECT ON product_variants TO anon, authenticated;
GRANT SELECT ON product_images TO anon, authenticated;
GRANT SELECT ON collections TO anon, authenticated;
GRANT SELECT ON collection_products TO anon, authenticated;

-- Grant admin users full access to catalog tables
GRANT ALL ON categories TO authenticated;
GRANT ALL ON brands TO authenticated;
GRANT ALL ON products TO authenticated;
GRANT ALL ON product_variants TO authenticated;
GRANT ALL ON product_images TO authenticated;
GRANT ALL ON collections TO authenticated;
GRANT ALL ON collection_products TO authenticated;
GRANT ALL ON audit_logs TO authenticated;
