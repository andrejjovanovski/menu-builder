-- Better Auth creates its own auth tables (`user`, `session`, `account`, `verification`).
-- Run Better Auth migrations first, then run the app tables below.

create table if not exists profiles (
  id text primary key references "user"(id) on delete cascade,
  role text not null default 'owner' check (role in ('admin', 'owner')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function create_profile_for_new_user()
returns trigger as $$
begin
  insert into profiles (id, role)
  values (new.id, 'owner')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_create_profile_for_new_user on "user";

create trigger trg_create_profile_for_new_user
after insert on "user"
for each row
execute function create_profile_for_new_user();

create table if not exists restaurants (
  id uuid primary key,
  name text not null,
  slug text not null unique,
  subtitle text,
  description text,
  owner_id text not null references "user"(id) on delete cascade,
  logo_url text,
  qr_code_url text,
  est_year text,
  appearance text default 'minimal' check (appearance in ('minimal', 'visual')),
  background_color text,
  accent_color text,
  card_bg_color text,
  background_image_url text,
  slogan text,
  text_color text,
  muted_text_color text,
  footer_quote text,
  open_hours text,
  facebook_url text,
  instagram_url text,
  tiktok_url text,
  phone text,
  open_bottom_sheet_on_click boolean not null default true,
  recommendation_ai_enabled boolean not null default true,
  menu_filters_enabled boolean not null default true,
  feedback_enabled boolean not null default true,
  smart_highlights_enabled boolean not null default true,
  show_branding boolean not null default true,
  call_waiter_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table restaurants add column if not exists recommendation_ai_enabled boolean not null default true;
alter table restaurants add column if not exists menu_filters_enabled boolean not null default true;
alter table restaurants add column if not exists feedback_enabled boolean not null default true;

create table if not exists menu_categories (
  id uuid primary key,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  slug text not null,
  "order" integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, slug)
);

create table if not exists menu_items (
  id uuid primary key,
  category_id uuid not null references menu_categories(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null,
  image_url text,
  dietary_tags jsonb not null default '[]'::jsonb,
  allergen_tags jsonb not null default '[]'::jsonb,
  is_available boolean not null default true,
  is_best_seller boolean not null default false,
  is_new boolean not null default false,
  is_trending boolean not null default false,
  "order" integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table menu_items add column if not exists dietary_tags jsonb not null default '[]'::jsonb;
alter table menu_items add column if not exists allergen_tags jsonb not null default '[]'::jsonb;

create table if not exists payments (
  id uuid primary key,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  expiration_date date not null,
  notes text,
  status text not null default 'active' check (status in ('active', 'expired', 'canceled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists menu_analytics_events (
  id uuid primary key,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  item_id uuid references menu_items(id) on delete set null,
  event_type text not null check (event_type in (
    'menu_view', 'item_open', 'recommendation_request',
    'upsell_impression', 'upsell_tap'
  )),
  session_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists item_upsells (
  id           uuid primary key default gen_random_uuid(),
  item_id      uuid not null references menu_items(id) on delete cascade,
  suggested_id uuid not null references menu_items(id) on delete cascade,
  position     integer not null default 0,
  created_at   timestamptz not null default now(),
  unique (item_id, suggested_id)
);

create table if not exists menu_feedback_responses (
  id uuid primary key,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  session_id text not null,
  rating text not null check (rating in ('love', 'okay', 'hard_to_use')),
  created_at timestamptz not null default now(),
  unique (restaurant_id, session_id)
);

alter table menu_analytics_events add column if not exists item_id uuid references menu_items(id) on delete set null;
alter table menu_analytics_events add column if not exists session_id text;
alter table menu_analytics_events add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_restaurants_owner_id on restaurants(owner_id);
create index if not exists idx_restaurants_slug on restaurants(slug);
create index if not exists idx_menu_categories_restaurant_id on menu_categories(restaurant_id);
create index if not exists idx_menu_items_restaurant_id on menu_items(restaurant_id);
create index if not exists idx_menu_items_category_id on menu_items(category_id);
create index if not exists idx_menu_items_dietary_tags on menu_items using gin (dietary_tags);
create index if not exists idx_menu_items_allergen_tags on menu_items using gin (allergen_tags);
create index if not exists idx_payments_restaurant_id on payments(restaurant_id);
create index if not exists idx_menu_analytics_restaurant_id on menu_analytics_events(restaurant_id);
create index if not exists idx_menu_analytics_event_type on menu_analytics_events(event_type);
create index if not exists idx_menu_analytics_created_at on menu_analytics_events(created_at desc);
create index if not exists idx_menu_feedback_restaurant_id on menu_feedback_responses(restaurant_id);
create index if not exists idx_menu_feedback_rating on menu_feedback_responses(rating);
create index if not exists idx_item_upsells_item_id on item_upsells(item_id);

create table if not exists table_requests (
  id               uuid primary key default gen_random_uuid(),
  restaurant_id    uuid not null references restaurants(id) on delete cascade,
  table_identifier text,
  request_type     text not null check (request_type in ('call_waiter', 'ask_for_bill')),
  status           text not null default 'pending' check (status in ('pending', 'done')),
  created_at       timestamptz not null default now()
);

create index if not exists idx_table_requests_restaurant_id on table_requests(restaurant_id);
create index if not exists idx_table_requests_status on table_requests(status);

create table if not exists promotions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  image_url text not null,
  duration_seconds integer not null check (duration_seconds > 0),
  valid_until timestamptz not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  display_frequency text not null default 'once_per_session'
    check (display_frequency in ('once_per_session', 'every_load')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table promotions add column if not exists display_frequency text
  not null default 'once_per_session'
  check (display_frequency in ('once_per_session', 'every_load'));

create index if not exists idx_promotions_restaurant_id on promotions(restaurant_id);
create index if not exists idx_promotions_lookup on promotions(restaurant_id, status, valid_until);
