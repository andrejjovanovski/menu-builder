// Apply the `promotions` table migration to the configured DATABASE_URL.
// Usage:
//   NODE_ENV=production DATABASE_URL='...' node scripts/migrate-promotions.mjs

import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config({ path: ".env.local" });
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "disable" ? false : { rejectUnauthorized: false },
});

const sql = `
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
`;

try {
  await pool.query(sql);
  console.log("promotions schema applied");
} finally {
  await pool.end();
}
