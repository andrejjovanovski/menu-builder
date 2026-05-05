import dotenv from "dotenv";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import { betterAuth } from "better-auth";
import { getMigrations } from "better-auth/db/migration";

dotenv.config({ path: ".env.local" });
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

if (!process.env.BETTER_AUTH_SECRET) {
  console.error("BETTER_AUTH_SECRET is required");
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

const db = new Kysely({
  dialect: new PostgresDialect({ pool }),
});

const auth = betterAuth({
  appName: "MenuCup",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  basePath: "/api/auth",
  secret: process.env.BETTER_AUTH_SECRET,
  database: {
    db,
    type: "postgres",
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: false,
  },
});

try {
  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();
  console.log("Better Auth migrations applied");
} finally {
  await db.destroy();
}
