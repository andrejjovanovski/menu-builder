// Migrate auth + app data from Supabase to Neon.
//
// Usage:
//   node scripts/migrate-supabase-to-neon.mjs --dry-run   (only counts, no writes)
//   node scripts/migrate-supabase-to-neon.mjs             (writes to Neon)
//
// Idempotent: re-running after a partial failure picks up where it left off
// (users matched by email, app rows by id with ON CONFLICT DO NOTHING).

import dotenv from "dotenv";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import { betterAuth } from "better-auth";
import crypto from "node:crypto";

dotenv.config({ path: ".env.migration" });

const SUPABASE_URL = process.env.SUPABASE_DB_URL;
const NEON_URL = process.env.NEON_DB_URL;
const AUTH_SECRET =
  process.env.BETTER_AUTH_SECRET_NEW || process.env.BETTER_AUTH_SECRET;
const DRY_RUN = process.argv.includes("--dry-run");

if (!SUPABASE_URL) throw new Error("SUPABASE_DB_URL not set");
if (!NEON_URL) throw new Error("NEON_DB_URL not set");
if (!AUTH_SECRET) throw new Error("BETTER_AUTH_SECRET_NEW not set");

const SKIP_RESTAURANT_SLUGS = ["bella-vista-italian"];
const SKIP_USER_EMAILS = ["test@example.com"];
const PASSWORD_OVERRIDES = {
  "vukanovski789@gmail.com": "password",
  "casperburgerbar@gmail.com": "password",
  "andrej@menucup.com": "password",
};

const sourcePool = new Pool({
  connectionString: SUPABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const targetPool = new Pool({
  connectionString: NEON_URL,
  ssl: { rejectUnauthorized: false },
});

const targetDb = new Kysely({
  dialect: new PostgresDialect({ pool: targetPool }),
});

const auth = betterAuth({
  appName: "MenuCup",
  baseURL: "http://localhost:3000",
  basePath: "/api/auth",
  secret: AUTH_SECRET,
  database: { db: targetDb, type: "postgres" },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: false,
  },
});

function log(...args) {
  console.log(...args);
}

async function fetchSource() {
  const { rows: users } = await sourcePool.query(
    `SELECT id, email, raw_user_meta_data, created_at
     FROM auth.users
     WHERE email <> ALL($1::text[])
     ORDER BY created_at`,
    [SKIP_USER_EMAILS]
  );

  const { rows: profiles } = await sourcePool.query(
    `SELECT id, email, role::text AS role, created_at
     FROM public.profiles
     WHERE email <> ALL($1::text[])`,
    [SKIP_USER_EMAILS]
  );

  const { rows: restaurants } = await sourcePool.query(
    `SELECT *
     FROM public.restaurants
     WHERE slug <> ALL($1::text[])
     ORDER BY created_at`,
    [SKIP_RESTAURANT_SLUGS]
  );
  const restaurantIds = restaurants.map((r) => r.id);

  const { rows: categories } = restaurantIds.length
    ? await sourcePool.query(
        `SELECT * FROM public.menu_categories WHERE restaurant_id = ANY($1::uuid[]) ORDER BY "order", created_at`,
        [restaurantIds]
      )
    : { rows: [] };

  const { rows: items } = restaurantIds.length
    ? await sourcePool.query(
        `SELECT * FROM public.menu_items WHERE restaurant_id = ANY($1::uuid[]) ORDER BY "order", created_at`,
        [restaurantIds]
      )
    : { rows: [] };

  const { rows: payments } = restaurantIds.length
    ? await sourcePool.query(
        `SELECT * FROM public.payments WHERE restaurant_id = ANY($1::uuid[]) ORDER BY created_at`,
        [restaurantIds]
      )
    : { rows: [] };

  return { users, profiles, restaurants, categories, items, payments };
}

async function lookupExistingUserId(email) {
  const { rows } = await targetPool.query(
    `SELECT id FROM "user" WHERE email = $1 LIMIT 1`,
    [email]
  );
  return rows[0]?.id ?? null;
}

async function ensureUser(srcUser) {
  const existing = await lookupExistingUserId(srcUser.email);
  if (existing) {
    log(`  · ${srcUser.email} already exists -> ${existing}`);
    return existing;
  }

  const password =
    PASSWORD_OVERRIDES[srcUser.email] ?? crypto.randomBytes(32).toString("hex");
  const name =
    srcUser.raw_user_meta_data?.name ||
    srcUser.raw_user_meta_data?.full_name ||
    srcUser.email.split("@")[0];

  const result = await auth.api.signUpEmail({
    body: { email: srcUser.email, password, name },
  });
  const newId = result?.user?.id;
  if (!newId) {
    throw new Error(`signUpEmail returned no user id for ${srcUser.email}`);
  }
  log(`  + ${srcUser.email} -> ${newId}`);
  return newId;
}

async function migrateUsers(users) {
  log(`\nMigrating ${users.length} users...`);
  const idMap = {};
  for (const u of users) {
    idMap[u.id] = await ensureUser(u);
  }
  return idMap;
}

async function applyProfileRoles(srcProfiles, idMap, client) {
  log(`\nApplying profile roles...`);
  for (const p of srcProfiles) {
    const newId = idMap[p.id];
    if (!newId) continue;
    const role = p.role || "owner";
    await client.query(
      `UPDATE profiles SET role = $1, created_at = $2 WHERE id = $3`,
      [role, p.created_at, newId]
    );
    log(`  · ${p.email} role=${role}`);
  }
}

function buildInsert(table, row, columnTransform = {}) {
  // Skip columns whose value is null/undefined so target schema defaults
  // apply (target may have NOT NULL DEFAULT on columns that are nullable in source).
  const cols = Object.keys(row).filter(
    (c) => row[c] !== null && row[c] !== undefined
  );
  const values = cols.map((c) => columnTransform[c]?.(row[c]) ?? row[c]);
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
  const colList = cols.map((c) => `"${c}"`).join(", ");
  return {
    text: `INSERT INTO "${table}" (${colList}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`,
    values,
  };
}

async function insertRestaurants(rows, idMap, client) {
  log(`\nInserting ${rows.length} restaurants...`);
  for (const r of rows) {
    const newOwnerId = idMap[r.owner_id];
    if (!newOwnerId) {
      throw new Error(
        `No mapped user for restaurant ${r.slug} (owner_id=${r.owner_id})`
      );
    }
    const remapped = { ...r, owner_id: newOwnerId };
    const q = buildInsert("restaurants", remapped);
    await client.query(q);
    log(`  + ${r.slug} (owner=${newOwnerId})`);
  }
}

async function insertSimple(table, rows, client) {
  log(`\nInserting ${rows.length} into ${table}...`);
  for (const r of rows) {
    const q = buildInsert(table, r);
    await client.query(q);
  }
  log(`  done.`);
}

async function verifyCounts() {
  log(`\n=== Final counts on Neon ===`);
  const tables = [
    "user",
    "account",
    "profiles",
    "restaurants",
    "menu_categories",
    "menu_items",
    "payments",
  ];
  for (const t of tables) {
    const { rows } = await targetPool.query(
      `SELECT count(*)::int AS n FROM "${t}"`
    );
    log(`  ${t.padEnd(20)} ${rows[0].n}`);
  }
}

async function main() {
  log(`Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "WRITE"}`);

  const src = await fetchSource();
  log(`\nSource counts:`);
  log(`  users         ${src.users.length}`);
  log(`  profiles      ${src.profiles.length}`);
  log(`  restaurants   ${src.restaurants.length}`);
  log(`  categories    ${src.categories.length}`);
  log(`  items         ${src.items.length}`);
  log(`  payments      ${src.payments.length}`);

  if (DRY_RUN) {
    log(`\nDry run complete. No writes performed.`);
    return;
  }

  const idMap = await migrateUsers(src.users);

  const client = await targetPool.connect();
  try {
    await client.query("BEGIN");
    await applyProfileRoles(src.profiles, idMap, client);
    await insertRestaurants(src.restaurants, idMap, client);
    await insertSimple("menu_categories", src.categories, client);
    await insertSimple("menu_items", src.items, client);
    await insertSimple("payments", src.payments, client);
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  await verifyCounts();
  log(`\nMigration complete.`);
}

main()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sourcePool.end();
    await targetPool.end();
  });
