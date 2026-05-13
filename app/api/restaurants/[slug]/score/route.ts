import { NextResponse } from "next/server";
import { getRestaurantBySlug } from "@/lib/repositories";
import { requireAppSession } from "@/lib/server-auth";
import { requireTier } from "@/lib/subscription";
import { calculateMenuScore, persistMenuScore } from "@/lib/menu-score";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { error, session } = await requireAppSession();
  if (error || !session) {
    return error;
  }

  const { slug } = await params;
  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  if (session.role !== "admin" && restaurant.owner_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tierGate = requireTier(restaurant, "pro");
  if (tierGate) {
    return tierGate;
  }

  const cached = restaurant.menu_score_breakdown as
    | { total: number }
    | null
    | undefined;
  const updatedAt = restaurant.menu_score_updated_at;
  const isFresh =
    updatedAt &&
    Date.now() - new Date(updatedAt).getTime() < 1000 * 60 * 60 * 6 &&
    cached;

  const breakdown = isFresh
    ? cached
    : await persistMenuScore(restaurant.id);

  return NextResponse.json({
    score: breakdown?.total ?? 0,
    breakdown,
    updated_at: isFresh ? updatedAt : new Date().toISOString(),
  });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { error, session } = await requireAppSession();
  if (error || !session) {
    return error;
  }

  const { slug } = await params;
  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  if (session.role !== "admin" && restaurant.owner_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tierGate = requireTier(restaurant, "pro");
  if (tierGate) {
    return tierGate;
  }

  // Force a fresh calculation for the recalculate button.
  const breakdown = await persistMenuScore(restaurant.id);
  // Also call calculateMenuScore for parity if needed (already inside persistMenuScore).
  void calculateMenuScore;

  return NextResponse.json({
    score: breakdown.total,
    breakdown,
    updated_at: new Date().toISOString(),
  });
}
