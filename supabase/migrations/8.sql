-- Add slug field to products table
ALTER TABLE products ADD COLUMN slug text UNIQUE;