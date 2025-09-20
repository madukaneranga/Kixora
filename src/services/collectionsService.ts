import { supabase } from '../lib/supabase';
import { Collection, CollectionWithProducts, HeroCollection } from '../types/collection';

/**
 * Fetch all active collections for hero swiper
 */
export const fetchActiveCollections = async (): Promise<HeroCollection[]> => {
  try {
    const { data, error } = await supabase
      .from('collections')
      .select(`
        id,
        slug,
        name,
        description,
        image_url,
        is_active,
        display_order,
        created_at,
        updated_at,
        collection_products(count)
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return data?.map(collection => ({
      ...collection,
      productCount: collection.collection_products?.[0]?.count || 0
    })) || [];
  } catch (error) {
    console.error('Error fetching active collections:', error);
    return [];
  }
};

/**
 * Fetch a specific collection by slug with its products
 */
export const fetchCollectionBySlug = async (slug: string): Promise<CollectionWithProducts | null> => {
  try {
    const { data, error } = await supabase
      .from('collections')
      .select(`
        id,
        slug,
        name,
        description,
        image_url,
        is_active,
        display_order,
        created_at,
        updated_at,
        collection_products!inner(
          display_order,
          products!inner(
            id,
            title,
            slug,
            price,
            sku,
            brands(
              name,
              slug
            ),
            product_images(
              storage_path,
              alt_text
            ),
            product_variants(
              id,
              size,
              color,
              stock,
              is_active
            )
          )
        )
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching collection by slug:', error);
    return null;
  }
};

/**
 * Fetch all collections (for collections page)
 */
export const fetchAllCollections = async (): Promise<Collection[]> => {
  try {
    const { data, error } = await supabase
      .from('collections')
      .select(`
        id,
        slug,
        name,
        description,
        image_url,
        is_active,
        display_order,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching all collections:', error);
    return [];
  }
};

/**
 * Fetch products in a specific collection
 */
export const fetchCollectionProducts = async (collectionId: string) => {
  try {
    const { data, error } = await supabase
      .from('collection_products')
      .select(`
        display_order,
        products!inner(
          id,
          title,
          slug,
          price,
          sku,
          featured,
          brands(
            name,
            slug
          ),
          product_images(
            storage_path,
            alt_text
          ),
          product_variants(
            id,
            size,
            color,
            stock,
            is_active
          )
        )
      `)
      .eq('collection_id', collectionId)
      .eq('products.is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return data?.map(item => ({
      ...item.products,
      position: item.display_order
    })) || [];
  } catch (error) {
    console.error('Error fetching collection products:', error);
    return [];
  }
};

/**
 * Fetch the pinned collection with its products for homepage display
 */
export const fetchPinnedCollection = async () => {
  try {
    // First, get the pinned collection
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('id, slug, name, description, image_url')
      .eq('is_pinned', true)
      .eq('is_active', true)
      .single();

    if (collectionError) {
      if (collectionError.code === 'PGRST116') {
        // No pinned collection found
        return null;
      }
      throw collectionError;
    }

    if (!collection) return null;

    // Then get the products for that collection
    const { data: collectionProducts, error: productsError } = await supabase
      .from('collection_products')
      .select(`
        display_order,
        products!inner(
          id,
          title,
          slug,
          price,
          sku,
          featured,
          brands(
            name,
            slug
          ),
          product_images(
            storage_path,
            alt_text
          ),
          product_variants(
            id,
            size,
            color,
            stock,
            is_active
          )
        )
      `)
      .eq('collection_id', collection.id)
      .eq('products.is_active', true)
      .order('display_order', { ascending: true });

    if (productsError) {
      console.error('Error fetching collection products:', productsError);
      return null;
    }

    // Transform the data structure
    const products = collectionProducts
      ?.map(item => ({
        ...item.products,
        position: item.display_order,
        brand: item.products.brands?.name,
        image: item.products.product_images?.[0]?.storage_path,
        images: item.products.product_images?.map(img => img.storage_path) || [],
        variants: item.products.product_variants?.filter(v => v.is_active !== false) || []
      })) || [];

    return {
      ...collection,
      products
    };
  } catch (error) {
    console.error('Error fetching pinned collection:', error);
    return null;
  }
};