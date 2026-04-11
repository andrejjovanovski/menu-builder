import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { query } from "@/lib/db";

export type AppUser = {
  id: string;
  email: string;
  name?: string | null;
};

export type AppSession = {
  user: AppUser;
  role: "admin" | "owner";
};

export async function getAppSession(): Promise<AppSession | null> {
  const session = await getServerSession();

  if (!session?.user) {
    return null;
  }

  const profileResult = await query<{ role: "admin" | "owner" }>(
    "select role from profiles where id = $1 limit 1",
    [session.user.id]
  );

  const role = profileResult.rows[0]?.role ?? "owner";

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    },
    role,
  };
}

export async function requireAppSession() {
  const session = await getAppSession();

  if (!session) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null,
    };
  }

  return { error: null, session };
}

export async function requireAdminSession() {
  const { error, session } = await requireAppSession();
  if (error || !session) {
    return { error, session: null };
  }

  if (session.role !== "admin") {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      session: null,
    };
  }

  return { error: null, session };
}
