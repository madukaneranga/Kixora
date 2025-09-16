/*
  # Database Functions and Triggers

  Creates essential functions and triggers for:
  1. User profile creation on signup
  2. Automatic timestamp updates
  3. Order number generation
  4. Stock management
  5. Audit logging
*/

-- =====================================================
-- USER MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = now();

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the signup
  RAISE WARNING 'Failed to create user profile: %', SQLERRM;
  RETURN new;
END;
$$;

-- =====================================================
-- TIMESTAMP UPDATE FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =====================================================
-- ORDER MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  order_count integer;
  new_order_number text;
BEGIN
  -- Get count of orders today
  SELECT COUNT(*) + 1 INTO order_count
  FROM orders
  WHERE DATE(created_at) = CURRENT_DATE;

  -- Generate order number: ORD-YYYYMMDD-XXX
  new_order_number := 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(order_count::text, 3, '0');

  NEW.order_number = new_order_number;
  RETURN NEW;
END;
$$;

-- =====================================================
-- STOCK MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to safely decrement product variant stock
CREATE OR REPLACE FUNCTION decrement_variant_stock(
  variant_id uuid,
  quantity integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_stock integer;
BEGIN
  -- Get current stock with row lock to prevent race conditions
  SELECT stock INTO current_stock
  FROM product_variants
  WHERE id = variant_id AND is_active = true
  FOR UPDATE;

  -- Check if variant exists and is active
  IF current_stock IS NULL THEN
    RAISE EXCEPTION 'Product variant not found or inactive: %', variant_id;
  END IF;

  -- Check if sufficient stock available
  IF current_stock < quantity THEN
    RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', current_stock, quantity;
  END IF;

  -- Update stock
  UPDATE product_variants
  SET
    stock = stock - quantity,
    updated_at = now()
  WHERE id = variant_id;

  RETURN true;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to update stock for variant %: %', variant_id, SQLERRM;
END;
$$;

-- Function to check variant availability
CREATE OR REPLACE FUNCTION check_variant_availability(
  variant_id uuid,
  required_quantity integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_stock integer;
  variant_active boolean;
  product_active boolean;
BEGIN
  -- Get variant info with product status
  SELECT
    pv.stock,
    pv.is_active,
    p.is_active
  INTO current_stock, variant_active, product_active
  FROM product_variants pv
  JOIN products p ON p.id = pv.product_id
  WHERE pv.id = variant_id;

  -- Check if variant exists and both variant and product are active
  IF current_stock IS NULL OR NOT variant_active OR NOT product_active THEN
    RETURN false;
  END IF;

  -- Check if sufficient stock available
  RETURN current_stock >= required_quantity;
END;
$$;

-- =====================================================
-- AUDIT LOGGING FUNCTION
-- =====================================================

-- Function to log data changes
CREATE OR REPLACE FUNCTION log_audit_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_data, user_id)
    VALUES (TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD), auth.uid());
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, record_id, action, new_data, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(NEW), auth.uid());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- =====================================================
-- CREATE TRIGGERS
-- =====================================================

-- User signup trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at timestamp triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carts_updated_at
  BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Order number generation trigger
CREATE TRIGGER generate_order_number_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- Audit logging triggers for important tables
CREATE TRIGGER audit_products_changes
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_orders_changes
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

CREATE TRIGGER audit_product_variants_changes
  AFTER INSERT OR UPDATE OR DELETE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION log_audit_changes();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION decrement_variant_stock(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION check_variant_availability(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_order_number() TO authenticated;