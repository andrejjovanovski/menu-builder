# AGENTS.md

This file gives coding agents the minimum working context for this repository.

## Product

MenuCup is a multilingual restaurant digital menu SaaS. Restaurant owners manage menus in a dashboard, while guests browse public menu pages. The product includes onboarding, authentication, branding controls, QR tools, analytics, feedback, and AI-assisted recommendations.

Primary languages: English and Macedonian via `next-intl`.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- PostgreSQL
- Better Auth
- S3-compatible storage
- OpenAI API for recommendations

## Local commands

```bash
docker-compose up -d
npm run db:setup
npm run dev
npm run build
npm run lint
npm run admin:create -- <email> <password>
```

There is no test suite configured at the moment.

## Environment

Copy `.env.example` to `.env.local`.

Key variables:

- `DATABASE_URL`, `DATABASE_SSL`
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT`, `S3_PUBLIC_URL_BASE`, `S3_FORCE_PATH_STYLE`
- `RESEND_API_KEY`, `SEND_EMAILS_TO`
- `OPENAI_API_KEY`, `OPENAI_RECOMMENDATION_MODEL`

## Architecture

### Database

- Application queries use raw `pg`
- Better Auth internals use Kysely in `lib/auth-config.ts`
- Shared DB access lives in `lib/db.ts`
- App schema lives in `database/schema.sql`
- Migration and maintenance scripts live in `scripts/`

### Auth and authorization

- Better Auth routes live under `/api/auth/[...all]`
- `profiles.role` is `admin` or `owner`
- Server auth helpers live in `lib/server-auth.ts`
- Client auth state lives in `hooks/useAuth.ts`
- Access control is enforced in application code, not with DB RLS

For protected routes:
1. Require a session with `requireAppSession()` or `requireAdminSession()`
2. Verify ownership against `restaurant.owner_id` unless the user is an admin

### Routing

- Public menu routes: `/[restaurant]` and `/[restaurant]/[category]`
- Dashboard routes: `/dashboard/*`
- Admin-only area: `/dashboard/payments`
- Onboarding flow: `/onboarding`

### State and data flow

- No global state library
- `hooks/useMenuBuilder.ts` owns dashboard menu CRUD state
- `hooks/useDashboardRestaurants.ts` handles restaurant listing and navigation
- `lib/api.ts` provides the client fetch wrapper
- Read-heavy queries are centralized in `lib/repositories.ts`

### Storage

Uploads go through `POST /api/uploads` to S3-compatible storage. Remote image patterns are configured in `next.config.ts`.

## Repo-specific guidance

- Prefer existing route, hook, and repository patterns over introducing new abstractions
- Keep SQL parameterized and consistent with the raw `pg` approach already used in the app
- When changing protected API routes, validate both session checks and owner/admin authorization
- When adding product features, consider whether the change should be gated by restaurant-level feature flags
- Preserve bilingual behavior when editing user-facing copy or flows
- Keep changes scoped; do not perform unrelated refactors

## Useful files

- `README.md` for setup and feature overview
- `CLAUDE.md` for fuller repository notes
- `database/schema.sql` for app tables
- `lib/` for DB, auth, storage, repositories, and OpenAI integration
- `hooks/` for client state
- `app/api/` for HTTP endpoints
