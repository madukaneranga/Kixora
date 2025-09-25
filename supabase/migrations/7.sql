-- Extend existing product_images table with missing fields for image upload functionality

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_display_order ON product_images(product_id, display_order);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(product_id, is_primary) WHERE is_primary = true;

-- Add RLS (Row Level Security) policies if they don't exist
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Product images are viewable by everyone" ON product_images;

-- Create function to ensure only one primary image per product
CREATE OR REPLACE FUNCTION ensure_single_primary_image()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this image as primary, unset all other primary images for this product
  IF NEW.is_primary = true THEN
    UPDATE product_images
    SET is_primary = false, updated_at = now()
    WHERE product_id = NEW.product_id
    AND id != NEW.id
    AND is_primary = true;
  END IF;

  -- If this is the only image for the product, make it primary
  IF NOT EXISTS (
    SELECT 1 FROM product_images
    WHERE product_id = NEW.product_id
    AND id != COALESCE(NEW.id, gen_random_uuid())
  ) THEN
    NEW.is_primary = true;
  END IF;

  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger to avoid conflicts
DROP TRIGGER IF EXISTS trigger_ensure_single_primary_image ON product_images;
CREATE TRIGGER trigger_ensure_single_primary_image
  BEFORE INSERT OR UPDATE ON product_images
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_image();

-- Drop existing storage policies and recreate them
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
  DROP POLICY IF EXISTS "Admin users can upload product images" ON storage.objects;
  DROP POLICY IF EXISTS "Admin users can update product images" ON storage.objects;
  DROP POLICY IF EXISTS "Admin users can delete product images" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

