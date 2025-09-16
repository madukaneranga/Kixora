export interface Collection {
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
}

export interface CollectionProduct {
  id: string;
  collection_id: string;
  product_id: string;
  display_order: number;
  created_at: string;
}

export interface CollectionWithProducts extends Collection {
  collection_products: {
    position: number;
    products: {
      id: string;
      title: string;
      price: number;
      sku: string;
      brands?: {
        name: string;
        slug: string;
      };
      product_images: {
        storage_path: string;
        alt_text?: string;
      }[];
      product_variants: {
        id: string;
        size?: string;
        color?: string;
        stock: number;
      }[];
    };
  }[];
}

export interface HeroCollection extends Collection {
  productCount?: number;
}