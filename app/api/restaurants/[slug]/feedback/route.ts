import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getRestaurantBySlug } from "@/lib/repositories";

const VALID_RATINGS = new Set(["love", "okay", "hard_to_use"]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const restaurant = await getRestaurantBySlug(slug);

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    if (restaurant.feedback_enabled === false) {
      return NextResponse.json({ error: "Feedback is disabled" }, { status: 403 });
    }

    const body = await request.json();
    const rating = String(body.rating ?? "");
    const sessionId = String(body.session_id ?? "").trim();

    if (!VALID_RATINGS.has(rating)) {
      return NextResponse.json({ error: "Invalid feedback rating" }, { status: 400 });
    }

    if (!sessionId) {
      return NextResponse.json({ error: "Session is required" }, { status: 400 });
    }

    await query(
      `insert into menu_feedback_responses (id, restaurant_id, session_id, rating)
       values ($1, $2, $3, $4)
       on conflict (restaurant_id, session_id)
       do update set rating = excluded.rating`,
      [randomUUID(), restaurant.id, sessionId, rating]
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save feedback";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
