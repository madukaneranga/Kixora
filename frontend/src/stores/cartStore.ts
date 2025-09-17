import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { showErrorToast } from '../components/ui/CustomToast';

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
  clearCart: (userId?: string) => Promise<void>;
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
      
      clearCart: async (userId) => {
        set({ items: [] });

        // Auto-sync to database if user is authenticated
        const currentUserId = userId || get().currentUserId;
        if (currentUserId) {
          try {
            await get().syncToDb(currentUserId);
          } catch (error) {
            console.warn('Could not sync cart clear to database:', error);
          }
        }
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
            // For existing users, merge local cart with database cart
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
                  stock,
                  is_active,
                  products (
                    id,
                    title,
                    price,
                    is_active,
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
            const dbItems: CartItem[] = cart.cart_items
              .filter((item: any) =>
                item.product_variants?.is_active &&
                item.product_variants?.products?.is_active
              )
              .map((item: any) => ({
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
                maxStock: item.product_variants.stock,
              }));

            // Merge logic with stock validation
            const mergedItems: CartItem[] = [];
            const adjustmentWarnings: string[] = [];

            // First add all DB items
            for (const dbItem of dbItems) {
              const availableStock = dbItem.maxStock || 0;

              if (availableStock > 0) {
                mergedItems.push({
                  ...dbItem,
                  quantity: Math.min(dbItem.quantity, availableStock)
                });

                if (dbItem.quantity > availableStock) {
                  adjustmentWarnings.push(
                    `${dbItem.title} quantity reduced from ${dbItem.quantity} to ${availableStock} due to stock limitations`
                  );
                }
              }
            }

            // Then merge local items
            for (const localItem of localItems) {
              const existingIndex = mergedItems.findIndex(
                dbItem => dbItem.variantId === localItem.variantId
              );

              if (existingIndex >= 0) {
                // Item exists in both - merge quantities with stock validation
                const existing = mergedItems[existingIndex];
                const desiredQty = existing.quantity + localItem.quantity;
                const availableStock = existing.maxStock || 0;

                if (availableStock > 0) {
                  const finalQty = Math.min(desiredQty, availableStock);
                  mergedItems[existingIndex].quantity = finalQty;

                  if (desiredQty > availableStock) {
                    adjustmentWarnings.push(
                      `${existing.title} quantity adjusted from ${desiredQty} to ${finalQty} due to stock limitations`
                    );
                  }
                }
              } else {
                // Item only exists locally - validate stock before adding
                try {
                  const stockPromise = supabase
                    .from('product_variants')
                    .select('stock, is_active, products(is_active)')
                    .eq('id', localItem.variantId)
                    .single();

                  const { data: variant } = await Promise.race([stockPromise, timeoutPromise]) as any;

                  if (variant?.is_active && variant?.products?.is_active) {
                    const availableStock = variant.stock || 0;

                    if (availableStock > 0) {
                      const finalQty = Math.min(localItem.quantity, availableStock);

                      mergedItems.push({
                        ...localItem,
                        quantity: finalQty,
                        maxStock: availableStock
                      });

                      if (localItem.quantity > availableStock) {
                        adjustmentWarnings.push(
                          `${localItem.title} quantity reduced from ${localItem.quantity} to ${finalQty} due to stock limitations`
                        );
                      }
                    }
                  }
                } catch (error) {
                  console.warn(`Could not validate stock for ${localItem.title}:`, error);
                  // Skip this item if we can't validate stock
                }
              }
            }

            set({ items: mergedItems });

            // Show warnings to user if any adjustments were made
            if (adjustmentWarnings.length > 0) {
              console.warn('Cart merge adjustments:', adjustmentWarnings);

              // Show toast notifications for adjustments
              if (adjustmentWarnings.length === 1) {
                showErrorToast(adjustmentWarnings[0]);
              } else {
                showErrorToast(`${adjustmentWarnings.length} items had quantity adjustments due to stock limitations`);
              }
            }

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