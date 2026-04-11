import dotenv from "dotenv";
import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import { betterAuth } from "better-auth";

dotenv.config({ path: ".env.local" });
dotenv.config();

const [, , email, password, ...nameParts] = process.argv;
const name = nameParts.join(" ").trim() || "Admin User";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

if (!process.env.BETTER_AUTH_SECRET) {
  console.error("BETTER_AUTH_SECRET is required");
  process.exit(1);
}

if (!email || !password) {
  console.error("Usage: npm run admin:create -- <email> <password> [name]");
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
  const existing = await pool.query(
    'select id, email from "user" where email = $1 limit 1',
    [email]
  );

  let userId = existing.rows[0]?.id;

  if (!userId) {
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    userId = result.user.id;
    console.log(`Created user ${email}`);
  } else {
    console.log(`User ${email} already exists`);
  }

  await pool.query(
    `insert into profiles (id, role)
     values ($1, 'admin')
     on conflict (id)
     do update set role = 'admin', updated_at = now()`,
    [userId]
  );

  console.log(`Granted admin role to ${email}`);
} finally {
  await db.destroy();
}
