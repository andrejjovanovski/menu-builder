import dotenv from "dotenv";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import { betterAuth } from "better-auth";

dotenv.config({ path: ".env.local" });
dotenv.config();

const [, , email, newPassword] = process.argv;

if (!email || !newPassword) {
  console.error("Usage: node scripts/reset-password.mjs <email> <newPassword>");
  process.exit(1);
}

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
      : { rejectUnauthorized: false },
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
  const userResult = await pool.query(
    'select id, email from "user" where email = $1 limit 1',
    [email]
  );

  const user = userResult.rows[0];
  if (!user) {
    console.error(`No user found with email ${email}`);
    process.exit(1);
  }

  const ctx = await auth.$context;
  const hashed = await ctx.password.hash(newPassword);

  const updateResult = await pool.query(
    `update account
     set password = $1, "updatedAt" = now()
     where "userId" = $2 and "providerId" = 'credential'`,
    [hashed, user.id]
  );

  if (updateResult.rowCount === 0) {
    console.error(
      `User ${email} has no credential account (signed up via OAuth?). Aborted.`
    );
    process.exit(1);
  }

  console.log(`Password updated for ${email}`);
} finally {
  await db.destroy();
}
