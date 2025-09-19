/*
  # Complete Database Schema

  Creates all tables for the eCommerce platform in proper dependency order:
  1. Core tables (profiles, categories, brands)
  2. Product catalog (products, variants, images)
  3. Collections system
  4. User data (wishlists, carts, orders)
  5. Reviews system
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- User profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Product categories
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  image_url text,
  is_pinned boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Product brands
CREATE TABLE brands (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- PRODUCT CATALOG
-- =====================================================

-- Main products table
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL CHECK (price >= 0),
  currency text DEFAULT 'LKR',
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  brand_id uuid REFERENCES brands(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  return_policy text,
  deleted_at TIMESTAMPTZ NULL,
  deleted_by UUID REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Product variants (sizes, colors, etc.)
CREATE TABLE product_variants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  sku text UNIQUE NOT NULL,
  size text,
  color text,
  price_override decimal(10,2) CHECK (price_override >= 0),
  stock integer DEFAULT 0 CHECK (stock >= 0),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Product images
CREATE TABLE product_images (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  alt_text text,
  display_order integer DEFAULT 0,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- COLLECTIONS SYSTEM
-- =====================================================

-- Product collections for marketing
CREATE TABLE collections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  image_url text,
  is_active boolean DEFAULT true,
  is_pinned boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Junction table for collections and products
CREATE TABLE collection_products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id uuid REFERENCES collections(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(collection_id, product_id)
);

-- =====================================================
-- USER DATA
-- =====================================================

-- User wishlists/favorites
CREATE TABLE wishlists (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Shopping carts
CREATE TABLE carts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Cart items
CREATE TABLE cart_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id uuid REFERENCES carts(id) ON DELETE CASCADE,
  product_variant_id uuid REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  price decimal(10,2) NOT NULL CHECK (price >= 0),
  added_at timestamptz DEFAULT now(),
  UNIQUE(cart_id, product_variant_id)
);

-- Orders
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  order_number text UNIQUE NOT NULL,
  total decimal(10,2) NOT NULL CHECK (total >= 0),
  currency text DEFAULT 'LKR',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method text,
  payment_provider text,
  payment_provider_id text,
  billing_address jsonb,
  shipping_address jsonb,
  shipping_method text,
  shipping_cost decimal(10,2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Order items (snapshot of purchased items)
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_variant_id uuid REFERENCES product_variants(id) ON DELETE RESTRICT,
  product_title text NOT NULL,
  variant_info jsonb NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price decimal(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price decimal(10,2) NOT NULL CHECK (total_price >= 0),
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- REVIEWS SYSTEM
-- =====================================================

-- Product reviews
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  content text,
  is_verified_purchase boolean DEFAULT false,
  is_approved boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, user_id)
);

-- =====================================================
-- AUDIT LOGS
-- =====================================================

-- System audit logs
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name text NOT NULL,
  record_id uuid,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb,
  new_data jsonb,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Profile indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Product indexes
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_products_price ON products(price);

-- Product variant indexes
CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_active ON product_variants(is_active);
CREATE INDEX idx_variants_stock ON product_variants(stock);

-- Order indexes
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Cart indexes
CREATE INDEX idx_carts_user ON carts(user_id);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);

-- Collection indexes
CREATE INDEX idx_collections_active ON collections(is_active);
CREATE INDEX idx_collection_products_collection ON collection_products(collection_id);

-- Review indexes
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Audit log indexes
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
