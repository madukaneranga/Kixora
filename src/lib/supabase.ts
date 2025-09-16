import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: 'user' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'user' | 'admin';
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: 'user' | 'admin';
        };
      };
      categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          image_url: string | null;
          is_active: boolean;
          is_pinned: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;

        };
      };
      products: {
        Row: {
          id: string;
          sku: string;
          title: string;
          description: string | null;
          price: number;
          currency: string;
          category_id: string | null;
          brand_id: string | null;
          is_active: boolean;
          featured: boolean;
          return_policy: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          storage_path: string;
          alt_text: string | null;
          display_order: number;
          is_primary: boolean;
          created_at: string;
        };
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string;
          size: string | null;
          color: string | null;
          price_override: number | null;
          stock: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      cart_items: {
        Row: {
          id: string;
          cart_id: string;
          product_variant_id: string;
          quantity: number;
          price: number;
          added_at: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          order_number: string;
          total: number;
          currency: string;
          status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
          payment_status: 'unpaid' | 'paid' | 'refunded';
          payment_method: string | null;
          payment_provider: string | null;
          payment_provider_id: string | null;
          billing_address: any;
          shipping_address: any;
          shipping_method: string | null;
          shipping_cost: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          product_id: string;
          user_id: string;
          rating: number;
          title: string | null;
          content: string | null;
          is_approved: boolean;
          is_verified_purchase: boolean;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
};