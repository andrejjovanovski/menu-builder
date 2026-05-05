export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  subtitle: string;
  description: string;
  owner_id: string;
  logo_url?: string;
  qr_code_url?: string;
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
  recommendation_ai_enabled?: boolean;
  menu_filters_enabled?: boolean;
  feedback_enabled?: boolean;
  smart_highlights_enabled?: boolean;
  show_branding?: boolean;
  call_waiter_enabled?: boolean;
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
  dietary_tags?: string[];
  allergen_tags?: string[];
  is_available: boolean;
  is_best_seller: boolean;
  is_new: boolean;
  is_trending: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface Upsell {
  id: string;
  item_id: string;
  suggested_id: string;
  position: number;
  created_at: string;
}

export type TableRequestType = 'call_waiter' | 'ask_for_bill';
export type TableRequestStatus = 'pending' | 'done';

export interface TableRequest {
  id: string;
  restaurant_id: string;
  table_identifier: string | null;
  request_type: TableRequestType;
  status: TableRequestStatus;
  created_at: string;
}

export interface UpsellItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  source: 'manual' | 'auto';
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
  dietary_tags?: string[];
  allergen_tags?: string[];
  is_available: boolean;
  order: number;
}

export interface UpdateMenuItemInput {
  name?: string;
  description?: string;
  price?: number;
  image_url?: string;
  dietary_tags?: string[];
  allergen_tags?: string[];
  is_available?: boolean;
  is_best_seller?: boolean;
  is_new?: boolean;
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
  recommendationAiEnabled: boolean;
  menuFiltersEnabled: boolean;
  feedbackEnabled: boolean;
  smartHighlightsEnabled: boolean;
  callWaiterEnabled: boolean;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  phone?: string;
}

export type UserRole = 'admin' | 'owner' | null;

export interface AppUser {
  id: string;
  email: string;
  name?: string | null;
}

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

export type AnalyticsEventType =
  | "menu_view"
  | "item_open"
  | "recommendation_request"
  | "upsell_impression"
  | "upsell_tap";

export type PromotionStatus = 'active' | 'inactive';
export type PromotionDisplayFrequency = 'once_per_session' | 'every_load';

export interface Promotion {
  id: string;
  restaurant_id: string;
  image_url: string;
  duration_seconds: number;
  valid_until: string;
  status: PromotionStatus;
  display_frequency: PromotionDisplayFrequency;
  created_at: string;
  updated_at: string;
}

export interface CreatePromotionInput {
  restaurant_id: string;
  image_url: string;
  duration_seconds: number;
  valid_until: string;
  status?: PromotionStatus;
  display_frequency?: PromotionDisplayFrequency;
}

export interface UpdatePromotionInput {
  image_url?: string;
  duration_seconds?: number;
  valid_until?: string;
  status?: PromotionStatus;
  display_frequency?: PromotionDisplayFrequency;
}

export interface RestaurantAnalyticsSummary {
  totals: {
    menuViews: number;
    itemOpens: number;
    recommendationRequests: number;
  };
  feedback: {
    total: number;
    love: number;
    okay: number;
    hardToUse: number;
  };
  topItems: Array<{
    item_id: string;
    item_name: string;
    opens: number;
  }>;
}
