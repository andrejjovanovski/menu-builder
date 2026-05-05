import dotenv from "dotenv";
import { readFile } from "node:fs/promises";
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

try {
  const sql = await readFile(new URL("../database/schema.sql", import.meta.url), "utf8");
  await pool.query(sql);
  console.log("App schema applied");
} finally {
  await pool.end();
}
