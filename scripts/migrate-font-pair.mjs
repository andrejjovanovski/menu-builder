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
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS font_pair_id TEXT NOT NULL DEFAULT 'classic';
`;

try {
  await pool.query(sql);
  console.log("Migration applied: restaurants.font_pair_id");
} finally {
  await pool.end();
}
