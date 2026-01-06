export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  subtitle: string;
  description: string;
  owner_id: string;
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

export type UserRole = 'admin' | 'owner' | null