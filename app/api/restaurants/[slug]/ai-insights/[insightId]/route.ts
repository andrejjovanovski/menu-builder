import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getRestaurantBySlug } from "@/lib/repositories";
import { requireAppSession } from "@/lib/server-auth";
import { requireTier } from "@/lib/subscription";

const ALLOWED_STATUS = new Set(["open", "done", "dismissed"]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; insightId: string }> }
) {
  const { error, session } = await requireAppSession();
  if (error || !session) {
    return error;
  }

  const { slug, insightId } = await params;
  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }
  if (session.role !== "admin" && restaurant.owner_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tierGate = requireTier(restaurant, "business");
  if (tierGate) return tierGate;

  const body = await request.json();
  const status = String(body.status ?? "");
  if (!ALLOWED_STATUS.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const result = await query(
    `update restaurant_ai_insights
     set status = $1
     where id = $2 and restaurant_id = $3
     returning *`,
    [status, insightId, restaurant.id]
  );

  if (result.rowCount === 0) {
    return NextResponse.json({ error: "Insight not found" }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}
