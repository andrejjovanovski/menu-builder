import { NextResponse } from "next/server";
import { getAppSession } from "@/lib/server-auth";

export async function GET() {
  const session = await getAppSession();
  if (!session) {
    return NextResponse.json({ user: null, role: null }, { status: 401 });
  }

  return NextResponse.json(session);
}
