import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

interface WishlistItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  image?: string;
}

interface WishlistStore {
  items: WishlistItem[];
  loading: boolean;
  fetchWishlist: (userId: string) => Promise<void>;
  addToWishlist: (userId: string, productId: string) => Promise<void>;
  addToWishlistLocal: (productId: string) => Promise<void>;
  removeFromWishlist: (userId: string, productId: string) => Promise<void>;
  clearWishlist: (userId: string) => Promise<void>;
  clearLocal: () => void;
  isInWishlist: (productId: string) => boolean;
  getItemCount: () => number;
  mergeWithDbWishlist: (userId: string) => Promise<void>;
  syncToDb: (userId: string) => Promise<void>;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      loading: false,
  
  fetchWishlist: async (userId: string) => {
    set({ loading: true });
    try {
      console.log('Fetching wishlist for user:', userId);
      const { data, error } = await supabase
        .from('wishlists')
        .select(`
          id,
          product_id,
          products (
            id,
            title,
            price,
            product_images (
              storage_path
            )
          )
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Supabase error fetching wishlist:', error);
        return;
      }

      console.log('Wishlist data received:', data);

      if (data) {
        const items: WishlistItem[] = data.map((item: any) => ({
          id: item.id,
          productId: item.product_id,
          title: item.products.title,
          price: item.products.price,
          image: item.products.product_images?.[0]?.storage_path,
        }));

        console.log('Processed wishlist items:', items);
        set({ items });
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      set({ loading: false });
    }
  },
  
  addToWishlist: async (userId: string, productId: string) => {
    try {
      console.log('Adding to wishlist - userId:', userId, 'productId:', productId);

      // Try database first, but fallback to local storage
      try {
        const { error } = await supabase
          .from('wishlists')
          .insert({
            user_id: userId,
            product_id: productId,
          });

        if (!error) {
          console.log('Successfully added to wishlist database');
          // Then fetch fresh data to update local state
          await get().fetchWishlist(userId);
        } else {
          console.error('Database error adding to wishlist:', error);
          // Fallback to local-only storage
          await get().addToWishlistLocal(productId);
        }
      } catch (dbError) {
        console.warn('Database unavailable, adding to local wishlist:', dbError);
        // Fallback to local-only storage
        await get().addToWishlistLocal(productId);
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw error; // Re-throw to be caught by the UI
    }
  },

  addToWishlistLocal: async (productId: string) => {
    // Add item locally without database
    const currentItems = get().items;

    // Check if already in wishlist
    if (currentItems.some(item => item.productId === productId)) {
      return;
    }

    // Create a basic wishlist item (we'll fetch full details later)
    const newItem: WishlistItem = {
      id: crypto.randomUUID(),
      productId,
      title: 'Product', // Will be updated when we fetch full details
      price: 0, // Will be updated when we fetch full details
    };

    set({ items: [...currentItems, newItem] });
    console.log('Added to local wishlist:', newItem);
  },
  
  removeFromWishlist: async (userId: string, productId: string) => {
    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);

      if (!error) {
        set({
          items: get().items.filter(item => item.productId !== productId),
        });
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  },

  clearLocal: () => {
    set({ items: [] });
  },

  isInWishlist: (productId: string) => {
    return get().items.some(item => item.productId === productId);
  },

  clearWishlist: async (userId: string) => {
    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', userId);

      if (!error) {
        set({ items: [] });
      }
    } catch (error) {
      console.error('Error clearing wishlist:', error);
    }
  },

  getItemCount: () => {
    return get().items.length;
  },

  mergeWithDbWishlist: async (userId: string) => {
    try {
      console.log('Merging wishlist with database for user:', userId);

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Wishlist fetch timeout')), 5000);
      });

      const wishlistPromise = supabase
        .from('wishlists')
        .select(`
          id,
          product_id,
          products (
            id,
            title,
            price,
            product_images (
              storage_path
            )
          )
        `)
        .eq('user_id', userId);

      const { data, error } = await Promise.race([wishlistPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Error merging wishlist with database:', error);
        return;
      }

      console.log('Database wishlist data:', data);

      if (data) {
        const localItems = get().items;
        console.log('Local wishlist items:', localItems);

        const dbItems: WishlistItem[] = data.map((item: any) => ({
          id: item.id,
          productId: item.product_id,
          title: item.products.title,
          price: item.products.price,
          image: item.products.product_images?.[0]?.storage_path,
        }));

        // Merge logic: combine local and DB items, avoiding duplicates
        const mergedItems = [...dbItems];

        localItems.forEach(localItem => {
          const existsInDb = mergedItems.some(dbItem => dbItem.productId === localItem.productId);
          if (!existsInDb) {
            mergedItems.push(localItem);
          }
        });

        console.log('Merged wishlist items:', mergedItems);
        set({ items: mergedItems });

        // Sync back to DB
        await get().syncToDb(userId);
      }
    } catch (error) {
      console.warn('Could not sync wishlist with database, using local wishlist:', error.message);
    }
  },

  syncToDb: async (userId: string) => {
    try {
      const items = get().items;

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Wishlist sync timeout')), 5000);
      });

      // Clear existing wishlist items for this user
      const deletePromise = supabase
        .from('wishlists')
        .delete()
        .eq('user_id', userId);

      await Promise.race([deletePromise, timeoutPromise]);

      // Insert current items
      if (items.length > 0) {
        const wishlistItems = items.map(item => ({
          user_id: userId,
          product_id: item.productId,
        }));

        const insertPromise = supabase
          .from('wishlists')
          .insert(wishlistItems);

        await Promise.race([insertPromise, timeoutPromise]);
      }
    } catch (error) {
      console.warn('Could not sync wishlist to database:', error.message);
    }
  },
    }),
    {
      name: 'wishlist-storage',
    }
  )
);