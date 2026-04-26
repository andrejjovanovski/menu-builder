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
  ssl:
    process.env.DATABASE_SSL === "disable"
      ? false
      : process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
});

const sql = `
-- Smart Highlights columns on menu_items
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_new         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_trending    BOOLEAN NOT NULL DEFAULT false;

-- Feature flags on restaurants
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS smart_highlights_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_branding            BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS call_waiter_enabled      BOOLEAN NOT NULL DEFAULT false;

-- Upsells table
CREATE TABLE IF NOT EXISTS item_upsells (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id      UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  suggested_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  position     INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (item_id, suggested_id)
);

CREATE INDEX IF NOT EXISTS idx_item_upsells_item_id ON item_upsells(item_id);

-- Call Waiter / Table Requests
CREATE TABLE IF NOT EXISTS table_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id    UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_identifier TEXT,
  request_type     TEXT NOT NULL CHECK (request_type IN ('call_waiter', 'ask_for_bill')),
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_table_requests_restaurant_id ON table_requests(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_table_requests_status ON table_requests(status);

-- Analytics: allow upsell event types
ALTER TABLE menu_analytics_events
  DROP CONSTRAINT IF EXISTS menu_analytics_events_event_type_check;

ALTER TABLE menu_analytics_events
  ADD CONSTRAINT menu_analytics_events_event_type_check
  CHECK (event_type IN (
    'menu_view', 'item_open', 'recommendation_request',
    'upsell_impression', 'upsell_tap'
  ));
`;

try {
  await pool.query(sql);
  console.log("Migration applied: highlights + upsells + branding badge + call waiter");
} finally {
  await pool.end();
}
