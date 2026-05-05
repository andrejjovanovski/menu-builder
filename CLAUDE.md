# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is MenuCup

A multilingual restaurant digital menu SaaS. Restaurant owners manage their menus via a dashboard; customers browse public-facing menus. Features include AI recommendations (OpenAI), analytics, feedback, QR code generation, and S3 image uploads. Supports English and Macedonian (next-intl).

## Product Vision

MenuCup is positioned as a **smart menu system that helps hospitality businesses sell more** — not just a QR menu tool. The goal is to evolve it into an all-in-one digital system for hospitality (menus → ordering → reservations → customer insights).

**Target market**: Cafes, bars, and lounges — starting in the Balkans, then expanding.

**Monetization**: Freemium or tiered subscription. Advanced analytics, AI features, and upselling are paid tiers.

### Planned features (priority order)

1. **Smart highlights** — best sellers, trending items, new additions surfaced on the public menu
2. **Upselling system** — suggest related or higher-value items at the item-view level
3. **Table interaction** — "call waiter" or simple table-side requests
4. **Advanced analytics** — top/low-performing items, time-based insights, per-item conversion
5. **AI-driven actionable recommendations** — e.g. "add an image to X", "promote item Y", "consider removing Z"
6. **Menu performance score** — a scored health metric (0–100) with concrete improvement suggestions

When building new features, consider which tier they belong to and whether the `restaurants` feature-flag columns need extending.

## Commands

```bash
# Local infrastructure (PostgreSQL on 5433, MinIO on 9000/9001)
docker-compose up -d

# Database bootstrap (run once after docker-compose up)
npm run db:setup

# Dev server
npm run dev

# Build & lint
npm run build
npm run lint

# Create admin user
npm run admin:create -- <email> <password>
```

No test suite is configured.

## Environment Variables

Copy `.env.example` to `.env.local`. Required variables:

- `DATABASE_URL`, `DATABASE_SSL` — PostgreSQL connection
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` — Auth
- `NEXT_PUBLIC_APP_URL` — Base URL
- `S3_*` — S3/MinIO storage (REGION, BUCKET, ACCESS_KEY_ID, SECRET_ACCESS_KEY, ENDPOINT, PUBLIC_URL_BASE, FORCE_PATH_STYLE)
- `RESEND_API_KEY`, `SEND_EMAILS_TO` — Email
- `OPENAI_API_KEY`, `OPENAI_RECOMMENDATION_MODEL` — AI recommendations

## Architecture

### Database & ORM

- **Raw `pg`** for all application queries — parameterized SQL, no ORM abstraction
- **Kysely** only for Better Auth internals (in `lib/auth-config.ts`)
- `lib/db.ts` exports a singleton pool and a `withTransaction()` helper (BEGIN/COMMIT/ROLLBACK)
- Schema lives in `database/schema.sql`; migrations via `scripts/`

### Auth

- **Better Auth** handles sessions (email/password, HTTP-only cookies) at `/api/auth/[...all]`
- Custom `profiles` table stores `role` (`admin` | `owner`); a DB trigger auto-creates a profile on signup
- Server-side helpers in `lib/server-auth.ts`:
  - `getAppSession()` — returns `{ session, error }` with role
  - `requireAppSession()` — returns 401 if unauthenticated
  - `requireAdminSession()` — returns 403 if not admin
- Client-side: `useAuth()` hook fetches `/api/me`

### Authorization model

All access control is application-level (no DB RLS). API routes:
1. Call `requireAppSession()` / `requireAdminSession()`
2. Verify `restaurant.owner_id === session.user.id` (or allow if admin)

### API layer

All API routes live in `app/api/`. There is a thin `apiFetch<T>()` wrapper in `lib/api.ts` for client-side calls with automatic error extraction.

Route pattern: `/api/restaurants/[slug]/categories/[categorySlug]/items`

Public endpoints (no auth): menu read, analytics tracking, AI recommendations, feedback submission.

### State management

No global state library. Key hooks in `/hooks/`:
- `useMenuBuilder()` — full menu CRUD state for the dashboard
- `useDashboardRestaurants()` — restaurant list, payment status, locale-aware navigation
- `useAuth()` — session, user, role, login/signup/logout

### Routing

- **Public**: `/[restaurant]` and `/[restaurant]/[category]` — unauthenticated menu pages
- **Dashboard**: `/dashboard/*` — owner routes wrapped in `DashboardShell`
- **Admin-only**: `/dashboard/payments`
- **Onboarding**: `/onboarding` — multi-step restaurant creation after first signup
- Locale is read from the `NEXT_LOCALE` cookie in `middleware.ts` and forwarded as `x-next-intl-locale`

### Storage

Images uploaded via `POST /api/uploads` → S3-compatible (AWS or MinIO locally). Image URLs stored in DB; remote patterns configured in `next.config.ts`.

### Notable patterns

- **Slug-based multi-tenancy**: restaurants and categories identified by URL-friendly slugs
- **JSONB tags**: dietary/allergen tags on menu items stored as JSON arrays; indexed for filtering
- **Feature flags per restaurant**: `recommendations_ai_enabled`, `menu_filters_enabled`, `feedback_enabled`
- **Analytics**: session-scoped (sessionStorage) events tracked via `POST /api/restaurants/[slug]/analytics/track`
- **Repositories**: read-heavy queries centralized in `lib/repositories.ts`
- Tailwind CSS 4 with dark mode via `next-themes`; shared primitives in `src/components/ui/`
