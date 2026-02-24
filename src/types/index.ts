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
  muted_text_color?: string;
  footer_quote?: string;
  open_hours?: string;
  facebook_url?: string;
  instagram_url?: string;
  tiktok_url?: string;
  phone?: string;
  open_bottom_sheet_on_click?: boolean;
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
  mutedTextColor: string;
  openHours: string;
  footerQuote: string;
  openBottomSheetOnClick: boolean;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  phone?: string;
}

export type UserRole = 'admin' | 'owner' | null;

// Payment status stored in DB; "expires_soon" is derived in UI when status is active and expiration is near
export type PaymentStatus = 'active' | 'expired' | 'canceled';

export type PaymentStatusDisplay = 'active' | 'expires_soon' | 'expired' | 'canceled';

export interface Payment {
  id: string;
  restaurant_id: string;
  expiration_date: string; // ISO date
  notes: string | null;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentInput {
  restaurant_id: string;
  expiration_date: string;
  notes?: string | null;
  status?: PaymentStatus;
}

export interface UpdatePaymentInput {
  expiration_date?: string;
  notes?: string | null;
  status?: PaymentStatus;
}