# MenuCup

MenuCup is a multilingual restaurant menu platform built with Next.js, React, TypeScript, Tailwind CSS, PostgreSQL, Better Auth, and S3-compatible storage. It combines a public-facing digital menu, an authenticated menu-builder dashboard, restaurant onboarding, and admin payment tracking in one app.

## What the app includes

- Public restaurant menu pages at `/{restaurantSlug}`
- Optional category pages at `/{restaurantSlug}/{categorySlug}`
- Owner authentication with Better Auth
- Multi-step restaurant onboarding after signup
- Menu builder dashboard for restaurants, categories, and items
- Restaurant branding controls for colors, logo, background image, and social links
- QR code generation and sharing tools
- Admin-only payment management with derived statuses like `expires_soon`
- English and Macedonian localization with `next-intl`
- Landing page contact form powered by Resend

## Tech stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Framer Motion
- PostgreSQL
- Better Auth
- S3-compatible object storage
- `next-intl` for localization
- Resend for lead emails

## Main routes

- `/` marketing landing page
- `/login` sign in
- `/register` sign up
- `/onboarding` create the first restaurant after signup
- `/dashboard/menu-builder` authenticated menu management
- `/{restaurant}` public restaurant menu
- `/{restaurant}/{category}` category-specific menu page

## API routes

- `GET /api/restaurants` list restaurants for the signed-in owner
- `POST /api/restaurants` create a restaurant during onboarding or admin flow
- `GET /api/restaurants/[slug]` fetch one restaurant by slug
- `GET /api/restaurants/[slug]/categories` list categories for a restaurant
- `POST /api/restaurants/[slug]/categories` create a category for an owned restaurant
- `GET /api/restaurants/[slug]/categories/[categorySlug]/items` list items for a category
- `POST /api/restaurants/[slug]/categories/[categorySlug]/items` create an item for a category
- `GET /api/payments` admin-only payment list
- `POST /api/payments` admin-only payment creation
- `PATCH /api/payments/[id]` admin-only payment update

## Environment variables

Create `.env.local` with:

```env
DATABASE_URL=postgres://user:password@localhost:5432/menucup
DATABASE_SSL=disable
BETTER_AUTH_SECRET=replace-with-a-long-random-string
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
S3_REGION=auto
S3_BUCKET=menucup
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_ENDPOINT=https://your-s3-endpoint.example.com
S3_PUBLIC_URL_BASE=https://cdn.example.com/menucup
S3_FORCE_PATH_STYLE=false
RESEND_API_KEY=your-resend-api-key
SEND_EMAILS_TO=your-inbox@example.com
OPENAI_API_KEY=your-openai-api-key
OPENAI_RECOMMENDATION_MODEL=gpt-5.2
```

Notes:

- `DATABASE_URL` is the primary Postgres connection used by app routes and Better Auth.
- `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` are required for session handling.
- `NEXT_PUBLIC_APP_URL` is used by the browser auth client.
- `S3_*` variables configure logo, background, QR code, and menu image uploads.
- `RESEND_API_KEY` and `SEND_EMAILS_TO` are required for the landing page contact form.
- `OPENAI_API_KEY` enables the AI recommendation assistant on the public menu.
- `OPENAI_RECOMMENDATION_MODEL` lets you swap the model without code changes.

## Local development

```bash
npm install
cp .env.example oldenv.md
docker compose up -d
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Local services from `docker-compose.yml`:

- PostgreSQL: `localhost:5432`
- MinIO API: `http://localhost:9000`
- MinIO console: `http://localhost:9001`
- MinIO login: `menucup` / `menucup123`

Useful scripts:

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run db:migrate:auth`
- `npm run db:migrate:app`
- `npm run db:setup`

## Database setup

The repository now ships the domain schema in [database/schema.sql](/Users/andrej/Documents/menuCup/database/schema.sql). That file creates:

- `profiles`
- `restaurants`
- `menu_categories`
- `menu_items`
- `payments`

Run Better Auth migrations for its auth tables first, then apply `database/schema.sql`.
The repo now includes helper scripts for that:

```bash
npm run db:migrate:auth
npm run db:migrate:app
```

Or both at once:

```bash
npm run db:setup
```

### Create an admin user

Use the helper script:

```bash
npm run admin:create -- admin@example.com StrongPassword123 "MenuCup Admin"
```

If the user does not exist yet, this creates them first.
If they already exist, it upgrades their `profiles.role` to `admin`.

The app also expects an S3-compatible bucket for:

- `restaurant-assets` for logos and restaurant backgrounds
- `menu-items` for item images

The included Docker setup creates a local `menucup` bucket in MinIO automatically.

### App schema

```sql
create table if not exists profiles (
  id text primary key references "user"(id) on delete cascade,
  role text not null default 'owner' check (role in ('admin', 'owner')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  subtitle text,
  description text,
  owner_id text not null references "user"(id) on delete cascade,
  qr_code_url text,
  logo_url text,
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
  open_bottom_sheet_on_click boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  slug text not null,
  "order" integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, slug)
);

create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references menu_categories(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null,
  image_url text,
  is_available boolean not null default true,
  "order" integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  expiration_date date not null,
  notes text,
  status text not null default 'active' check (status in ('active', 'expired', 'canceled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_restaurants_slug on restaurants(slug);
create index if not exists idx_menu_categories_restaurant_id on menu_categories(restaurant_id);
create index if not exists idx_menu_items_restaurant_id on menu_items(restaurant_id);
create index if not exists idx_payments_restaurant_id on payments(restaurant_id);
```

The backend now uses application-level authorization and S3-compatible storage instead of Supabase RLS and Supabase buckets.

### Authorization model

Authorization is now enforced in application code instead of database RLS:

- public users can read restaurant and menu data
- owners can manage only restaurants they own
- admins can manage payments and cross-restaurant dashboard actions

## Localization

The app currently supports:

- `en`
- `mk`

Locale selection is stored in the `NEXT_LOCALE` cookie and passed through middleware to `next-intl`.

## Project structure

```text
app/
  actions/
    contact.ts
  api/
    payments/
    restaurants/
  dashboard/menu-builder/
  login/
  onboarding/
  register/
  [restaurant]/
    page.tsx
    [category]/page.tsx

hooks/
  useAuth.ts
  useMenuBuilder.ts

lib/
  auth.ts
  auth-client.ts
  db.ts
  storage.ts

messages/
  en.json
  mk.json

src/
  components/
    forms/
    menu-builder/
    public-menu/
    ui/
  types/
  utils/
```

## Product notes

- The public menu supports restaurant-level theming and social/contact actions.
- The public menu now includes an AI recommendation assistant that answers using the current restaurant menu only.
- The dashboard distinguishes between `owner` and `admin` roles.
- Payment status in the UI derives `expires_soon` when expiration is within 30 days.
- The onboarding flow writes the restaurant first, then uploads the optional logo through the app upload API.
- Remote images are configured from `S3_PUBLIC_URL_BASE` or `S3_ENDPOINT` in `next.config.ts`.

## Deployment

This app is set up well for Vercel:

1. Import the repository into Vercel.
2. Add the same environment variables from `.env.local`.
3. Point `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` at your deployed domain.
4. Provision PostgreSQL plus S3-compatible storage before the first deploy.

## First local run

From a clean clone, the shortest working path is:

```bash
npm install
cp .env.example oldenv.md
docker compose up -d
npm run db:setup
npm run dev
```

If you prefer SQL, you can still update `profiles.role` manually, but the script above is the easiest path.
