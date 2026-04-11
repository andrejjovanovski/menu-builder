import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Kysely, PostgresDialect } from "kysely";
import { pool } from "@/lib/db";

const baseURL =
  process.env.BETTER_AUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

const authDatabase = new Kysely({
  dialect: new PostgresDialect({
    pool,
  }),
});

export function createAuthInstance() {
  return betterAuth({
    appName: "MenuCup",
    baseURL,
    basePath: "/api/auth",
    secret: process.env.BETTER_AUTH_SECRET,
    database: {
      db: authDatabase,
      type: "postgres",
    },
    plugins: [nextCookies()],
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      requireEmailVerification: false,
    },
    trustedOrigins: [baseURL],
  });
}
