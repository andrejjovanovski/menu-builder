export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  subtitle: string;
  description: string;
  owner_id: string;
  logo_url?: string;
  est_year?: string;
  appearance?: "minimal" | "visual";
  background_color?: string;
  accent_color?: string;
  card_bg_color?: string;
  background_image_url?: string;
  slogan?: string;
  text_color?: string;
  created_at: string;
  updated_at: string;
}

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  slug: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateRestaurantInput {
  name: string;
  slug: string;
}

export interface UpdateRestaurantInput {
  name?: string;
  slug?: string;
}

export interface CreateMenuCategoryInput {
  restaurant_id: string;
  name: string;
  slug: string;
  order: number;
}

export interface UpdateMenuCategoryInput {
  name?: string;
  slug?: string;
  order?: number;
}

export interface CreateMenuItemInput {
  category_id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  order: number;
}

export interface UpdateMenuItemInput {
  name?: string;
  description?: string;
  price?: number;
  image_url?: string;
  is_available?: boolean;
  order?: number;
}

export interface RestaurantSettings {
  name: string;
  estYear: string;
  subtitle: string;
  slogan: string;
  logoUrl: string;
  appearance: "minimal" | "visual";
  backgroundColor: string;
  accentColor: string;
  cardBgColor: string;
  backgroundImageUrl: string;
  textColor: string;
}

export type UserRole = 'admin' | 'owner' | null;