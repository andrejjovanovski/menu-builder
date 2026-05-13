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
ALTER TABLE menu_categories
  ADD COLUMN IF NOT EXISTS image_url   TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS category_cards_enabled BOOLEAN NOT NULL DEFAULT true;
`;

try {
  await pool.query(sql);
  console.log("Migration applied: category cards (image_url, description, category_cards_enabled)");
} finally {
  await pool.end();
}
