export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
  brand: string | null;
  category_id: string | null;
  image_url: string | null;
  gallery: unknown;
  rating: number;
  review_count: number;
  is_featured: boolean;
  is_best_seller: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
}
