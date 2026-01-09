# Restaurant Menu Builder

A production-ready multi-tenant restaurant menu web application built with Next.js 14+, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Public Menu Display**: SEO-friendly dynamic routes for restaurant menus
- **Menu Builder Dashboard**: Authenticated admin interface for managing restaurants, categories, and items
- **Multi-tenant**: Each restaurant has its own slug-based URL
- **Responsive Design**: Mobile-first UI with Tailwind CSS
- **Image Upload**: Supabase Storage integration for menu item images
- **Drag & Drop Ordering**: Reorder categories and items
- **Row Level Security**: Secure data access with Supabase RLS policies

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL, Auth, Storage)
- **Deployment**: Vercel
- **Database**: Supabase PostgreSQL with RLS policies

## Themes

| Name     | --background | --acent | --card  |
|----------|--------------|---------|---------|
| Amber    | #161412      | #E19638 | #211E1B |
| Emerald  | #0D1111      | #2DBF8D | #171C1C |
| Rose     | #141019      | #F04D95 | #131A21 |
| Midnight | #0B0E13      | #42B0F0 | #131A21 |
| Crimson  | #100F0F      | #E11B1B | #1B1919 |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd restaurant-menu-builder
```

2. Install dependencies:

```bash
npm install
```

3. Set up Supabase:

   - Create a new Supabase project
   - Run the SQL schema (see below) in your Supabase SQL editor
   - Get your project URL and API keys from Settings > API

4. Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

5. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Database Schema

Run this SQL in your Supabase SQL editor:

```sql
-- Create tables
CREATE TABLE restaurants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE menu_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurant_id, slug)
);

CREATE TABLE menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_restaurants_slug ON restaurants(slug);
CREATE INDEX idx_menu_categories_restaurant_id ON menu_categories(restaurant_id);
CREATE INDEX idx_menu_categories_slug ON menu_categories(slug);
CREATE INDEX idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX idx_menu_items_restaurant_id ON menu_items(restaurant_id);

-- Enable RLS
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public read restaurants" ON restaurants FOR SELECT USING (true);
CREATE POLICY "Owners manage restaurants" ON restaurants FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Public read menu_categories" ON menu_categories FOR SELECT USING (true);
CREATE POLICY "Owners manage menu_categories" ON menu_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM restaurants WHERE id = menu_categories.restaurant_id AND owner_id = auth.uid())
);

CREATE POLICY "Public read menu_items" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Owners manage menu_items" ON menu_items FOR ALL USING (
  EXISTS (SELECT 1 FROM restaurants WHERE id = menu_items.restaurant_id AND owner_id = auth.uid())
);
```

## Project Structure

```
app/
├── [restaurant]/
│   ├── page.tsx              # Restaurant menu overview
│   └── [category]/
│       └── page.tsx          # Category items
├── dashboard/
│   └── menu-builder/
│       └── page.tsx          # Admin dashboard
├── api/
│   └── restaurants/
│       ├── route.ts          # CRUD restaurants
│       └── [slug]/
│           ├── route.ts      # Get restaurant by slug
│           └── categories/
│               ├── route.ts  # CRUD categories
│               └── [categorySlug]/
│                   └── items/
│                       └── route.ts  # CRUD items
├── login/
│   └── page.tsx              # Authentication
lib/
├── supabase.ts              # Supabase clients
types/
├── index.ts                 # TypeScript types
utils/
├── slug.ts                  # Slug generation utility
```

## API Routes

- `GET/POST /api/restaurants` - List/Create restaurants (authenticated)
- `GET /api/restaurants/[slug]` - Get restaurant by slug
- `GET/POST /api/restaurants/[slug]/categories` - List/Create categories
- `GET/POST /api/restaurants/[slug]/categories/[categorySlug]/items` - List/Create items

## Deployment

### Vercel

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy

### Environment Variables

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Development

- Use `npm run dev` for development
- Use `npm run build` for production build
- Use `npm run lint` for linting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License
