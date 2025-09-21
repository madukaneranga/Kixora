-- Create delivery addresses table for saved user addresses
CREATE TABLE delivery_addresses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  address text NOT NULL,
  apartment text,
  city text NOT NULL,
  postal_code text NOT NULL,
  phone text NOT NULL,
  country_code text NOT NULL DEFAULT '+94',
  country text NOT NULL DEFAULT 'Sri Lanka',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_delivery_addresses_user ON delivery_addresses(user_id);
CREATE INDEX idx_delivery_addresses_default ON delivery_addresses(user_id, is_default) WHERE is_default = true;

-- Ensure only one default address per user
CREATE UNIQUE INDEX idx_delivery_addresses_unique_default ON delivery_addresses(user_id) WHERE is_default = true;