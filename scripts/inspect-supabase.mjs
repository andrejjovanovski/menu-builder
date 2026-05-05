// Read-only inspection of the Supabase Postgres source.
// Lists public-schema tables with row counts and shows auth.users structure
// so we know what we're migrating before writing the destructive script.

import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config({ path: ".env.migration" });

if (!process.env.SUPABASE_DB_URL) {
  console.error("SUPABASE_DB_URL not set in .env.migration");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const client = await pool.connect();
  try {
    console.log("Connected to Supabase.\n");

    const publicTables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log(`=== public schema (${publicTables.rows.length} tables) ===`);
    for (const { table_name } of publicTables.rows) {
      const { rows } = await client.query(
        `SELECT count(*)::int AS n FROM public.${client.escapeIdentifier(table_name)}`
      );
      console.log(`  ${table_name.padEnd(40)} ${rows[0].n} rows`);
    }

    console.log("\n=== auth.users columns ===");
    const authCols = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'auth' AND table_name = 'users'
      ORDER BY ordinal_position
    `);
    for (const c of authCols.rows) {
      console.log(`  ${c.column_name.padEnd(30)} ${c.data_type}${c.is_nullable === "YES" ? " NULL" : ""}`);
    }

    const authCount = await client.query(`SELECT count(*)::int AS n FROM auth.users`);
    console.log(`\n  auth.users row count: ${authCount.rows[0].n}`);

    console.log("\n=== restaurants (slug, owner_id, name) ===");
    const restaurants = await client.query(`
      SELECT id, slug, owner_id, name
      FROM public.restaurants
      ORDER BY slug
    `);
    for (const r of restaurants.rows) {
      console.log(`  slug=${r.slug.padEnd(25)} owner_id=${r.owner_id} name=${r.name}`);
    }

    console.log("\n=== auth.users (id, email) ===");
    const users = await client.query(`
      SELECT id, email, created_at
      FROM auth.users
      ORDER BY created_at
    `);
    for (const u of users.rows) {
      console.log(`  id=${u.id} email=${u.email}`);
    }

    console.log("\n=== storage.buckets ===");
    const buckets = await client.query(`
      SELECT id, name, public
      FROM storage.buckets
      ORDER BY name
    `);
    for (const b of buckets.rows) {
      const { rows } = await client.query(
        `SELECT count(*)::int AS n FROM storage.objects WHERE bucket_id = $1`,
        [b.id]
      );
      console.log(`  ${b.name.padEnd(25)} public=${b.public} objects=${rows[0].n}`);
    }

    console.log("\nDone.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Inspection failed:", err);
  process.exit(1);
});
