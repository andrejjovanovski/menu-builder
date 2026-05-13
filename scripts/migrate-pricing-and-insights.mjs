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
-- Pricing tier on restaurants (basic | pro | business). Default 'basic' since the free tier was retired.
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'basic'
    CHECK (subscription_tier IN ('basic', 'pro', 'business'));

-- Menu Performance Score (Sprint 5)
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS menu_score INTEGER,
  ADD COLUMN IF NOT EXISTS menu_score_breakdown JSONB,
  ADD COLUMN IF NOT EXISTS menu_score_updated_at TIMESTAMPTZ;

-- AI owner-facing insights (Sprint 6)
CREATE TABLE IF NOT EXISTS restaurant_ai_insights (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  item_id         UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL,
  message         TEXT NOT NULL,
  priority        INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'dismissed')),
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_restaurant_ai_insights_restaurant_id
  ON restaurant_ai_insights(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_ai_insights_status
  ON restaurant_ai_insights(restaurant_id, status);

-- Backfill: restaurants with an active payment in the system get 'pro' (admins can promote to 'business' manually).
UPDATE restaurants r
SET subscription_tier = 'pro'
WHERE subscription_tier = 'basic'
  AND EXISTS (
    SELECT 1 FROM payments p
    WHERE p.restaurant_id = r.id
      AND p.status = 'active'
      AND p.expiration_date >= CURRENT_DATE
  );
`;

try {
  await pool.query(sql);
  console.log("Migration applied: pricing tier + menu score + AI insights");
} finally {
  await pool.end();
}
