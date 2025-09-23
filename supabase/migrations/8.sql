/*
  # Add updated_at columns to remaining tables

  Adds updated_at columns and triggers to tables that don't have them:
  - collection_products
  - wishlists
  - cart_items
  - order_items
  - audit_logs

  Note: product_images already has updated_at column added in migration 7.sql
*/

-- Add updated_at columns to remaining tables that don't have them
ALTER TABLE collection_products
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE wishlists
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE cart_items
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE audit_logs
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create triggers for updated_at columns (skip product_images as it's handled in migration 7)
CREATE TRIGGER update_collection_products_updated_at
  BEFORE UPDATE ON collection_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wishlists_updated_at
  BEFORE UPDATE ON wishlists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at
  BEFORE UPDATE ON order_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audit_logs_updated_at
  BEFORE UPDATE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ADD AUDIT LOGGING TRIGGERS TO ALL TABLES
-- =====================================================

/*
  Add audit logging triggers to all tables except audit_logs itself.

  Tables that already have audit triggers (from migration 3.sql):
  - products
  - orders
  - product_variants

  Tables getting new audit triggers:
  - profiles
  - categories
  - brands
  - product_images
  - collections
  - collection_products
  - wishlists
  - carts
  - cart_items
  - order_items
  - reviews
*/

-- Add audit logging triggers for all remaining tables
CREATE TRIGGER audit_profiles_changes
  AFTER  UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_categories_changes
  AFTER INSERT OR UPDATE OR DELETE ON categories
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_brands_changes
  AFTER INSERT OR UPDATE OR DELETE ON brands
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_product_images_changes
  AFTER INSERT OR UPDATE OR DELETE ON product_images
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_collections_changes
  AFTER INSERT OR UPDATE OR DELETE ON collections
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_collection_products_changes
  AFTER INSERT OR UPDATE OR DELETE ON collection_products
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_wishlists_changes
  AFTER INSERT OR UPDATE OR DELETE ON wishlists
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_carts_changes
  AFTER INSERT OR UPDATE OR DELETE ON carts
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_cart_items_changes
  AFTER INSERT OR UPDATE OR DELETE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_order_items_changes
  AFTER INSERT OR UPDATE OR DELETE ON order_items
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_reviews_changes
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();