import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  title: string;
  variant: {
    size: string;
    color: string;
    sku: string;
  };
  price: number;
  quantity: number;
  image?: string;
  maxStock?: number; // Track available stock for validation
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  currentUserId: string | null;
  addItem: (item: Omit<CartItem, 'id'>, userId?: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  removeItem: (itemId: string, userId?: string) => Promise<void>;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  setUserId: (userId: string | null, isNewUser?: boolean) => void;
  mergeWithDbCart: (userId: string) => Promise<void>;
  syncToDb: (userId: string) => Promise<void>;
  validateStockForItem: (itemId: string) => Promise<boolean>;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      currentUserId: null,

      addItem: async (item, userId) => {
        const items = get().items;
        const existingItem = items.find(i => i.variantId === item.variantId);
        
        if (existingItem) {
          set({
            items: items.map(i =>
              i.variantId === item.variantId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          });
        } else {
          set({
            items: [...items, { ...item, id: crypto.randomUUID() }],
          });
        }

        // Auto-sync to database if user is authenticated
        const currentUserId = userId || get().currentUserId;
        if (currentUserId) {
          try {
            await get().syncToDb(currentUserId);
          } catch (error) {
            console.warn('Could not sync cart to database:', error);
          }
        }
      },
      
      updateQuantity: async (itemId, quantity) => {
        if (quantity <= 0) {
          await get().removeItem(itemId);
          return true;
        }

        const item = get().items.find(i => i.id === itemId);
        if (!item) return false;

        try {
          // Check current stock availability
          const { data: variant, error } = await supabase
            .from('product_variants')
            .select('stock, is_active')
            .eq('id', item.variantId)
            .single();

          if (error) {
            console.error('Error checking stock:', error);
            return false;
          }

          if (!variant || !variant.is_active || variant.stock < quantity) {
            // Stock insufficient
            return false;
          }

          // Update quantity with stock info
          set({
            items: get().items.map(cartItem =>
              cartItem.id === itemId
                ? { ...cartItem, quantity, maxStock: variant.stock }
                : cartItem
            ),
          });

          // Auto-sync to database if user is authenticated
          const currentUserId = get().currentUserId;
          if (currentUserId) {
            try {
              await get().syncToDb(currentUserId);
            } catch (error) {
              console.warn('Could not sync cart to database:', error);
            }
          }

          return true;
        } catch (error) {
          console.error('Stock validation error:', error);
          return false;
        }
      },
      
      removeItem: async (itemId, userId) => {
        set({
          items: get().items.filter(item => item.id !== itemId),
        });

        // Auto-sync to database if user is authenticated
        const currentUserId = userId || get().currentUserId;
        if (currentUserId) {
          try {
            await get().syncToDb(currentUserId);
          } catch (error) {
            console.warn('Could not sync cart to database:', error);
          }
        }
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      setUserId: (userId, isNewUser = false) => {
        const prevUserId = get().currentUserId;
        set({ currentUserId: userId });

        if (userId) {
          if (isNewUser) {
            // For new users, sync local cart to database
            const items = get().items;
            if (items.length > 0) {
              get().syncToDb(userId);
            }
          } else {
            // For existing users, load their cart from database and clear local
            get().clearCart();
            get().mergeWithDbCart(userId);
          }
        } else if (prevUserId) {
          // Clear cart when user logs out
          get().clearCart();
        }
      },
      
      mergeWithDbCart: async (userId: string) => {
        try {
          // Add timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Cart fetch timeout')), 5000);
          });

          const cartPromise = supabase
            .from('carts')
            .select(`
              id,
              cart_items (
                id,
                quantity,
                price,
                product_variant_id,
                product_variants (
                  id,
                  sku,
                  size,
                  color,
                  products (
                    id,
                    title,
                    price,
                    product_images (
                      storage_path
                    )
                  )
                )
              )
            `)
            .eq('user_id', userId)
            .maybeSingle();

          const { data: cart } = await Promise.race([cartPromise, timeoutPromise]) as any;

          if (cart?.cart_items) {
            const localItems = get().items;
            const dbItems: CartItem[] = cart.cart_items.map((item: any) => ({
              id: item.id,
              productId: item.product_variants.products.id,
              variantId: item.product_variant_id,
              title: item.product_variants.products.title,
              variant: {
                size: item.product_variants.size || '',
                color: item.product_variants.color || '',
                sku: item.product_variants.sku,
              },
              price: item.price,
              quantity: item.quantity,
              image: item.product_variants.products.product_images?.[0]?.storage_path,
            }));

            // Merge logic: combine quantities for same variants
            const mergedItems = [...dbItems];

            localItems.forEach(localItem => {
              const existingIndex = mergedItems.findIndex(
                dbItem => dbItem.variantId === localItem.variantId
              );

              if (existingIndex >= 0) {
                mergedItems[existingIndex].quantity += localItem.quantity;
              } else {
                mergedItems.push(localItem);
              }
            });

            set({ items: mergedItems });

            // Sync back to DB
            await get().syncToDb(userId);
          }
        } catch (error) {
          console.warn('Could not sync cart with database, using local cart:', error.message);
          // Continue with local cart functionality
        }
      },
      
      validateStockForItem: async (itemId: string) => {
        const item = get().items.find(i => i.id === itemId);
        if (!item) return false;

        try {
          const { data: variant } = await supabase
            .from('product_variants')
            .select('stock, is_active')
            .eq('id', item.variantId)
            .single();

          if (!variant || !variant.is_active) {
            return false;
          }

          // Update maxStock info
          set({
            items: get().items.map(cartItem =>
              cartItem.id === itemId
                ? { ...cartItem, maxStock: variant.stock }
                : cartItem
            ),
          });

          return variant.stock >= item.quantity;
        } catch (error) {
          console.error('Stock validation error:', error);
          return false;
        }
      },

      syncToDb: async (userId: string) => {
        try {
          const items = get().items;

          // Add timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Cart sync timeout')), 5000);
          });

          // Get or create user cart
          const getCartPromise = supabase
            .from('carts')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

          let { data: cart } = await Promise.race([getCartPromise, timeoutPromise]) as any;

          if (!cart) {
            const createCartPromise = supabase
              .from('carts')
              .insert({ user_id: userId })
              .select('id')
              .single();

            const { data: newCart } = await Promise.race([createCartPromise, timeoutPromise]) as any;
            cart = newCart;
          }

          if (cart) {
            // Clear existing cart items
            const deletePromise = supabase
              .from('cart_items')
              .delete()
              .eq('cart_id', cart.id);

            await Promise.race([deletePromise, timeoutPromise]);

            // Insert current items
            if (items.length > 0) {
              const cartItems = items.map(item => ({
                cart_id: cart.id,
                product_variant_id: item.variantId,
                quantity: item.quantity,
                price: item.price,
              }));

              const insertPromise = supabase
                .from('cart_items')
                .insert(cartItems);

              await Promise.race([insertPromise, timeoutPromise]);
            }
          }
        } catch (error) {
          console.warn('Could not sync cart to database:', error.message);
          // Fail silently and continue with local cart
        }
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);