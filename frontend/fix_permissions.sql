-- Add missing grants for collections tables
GRANT SELECT ON collections TO anon, authenticated;
GRANT SELECT ON collection_products TO anon, authenticated;
GRANT ALL ON collections TO authenticated;
GRANT ALL ON collection_products TO authenticated;