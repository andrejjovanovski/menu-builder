import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getItemById, getRestaurantBySlug } from "@/lib/repositories";

const VALID_EVENTS = new Set(["menu_view", "item_open", "recommendation_request"]);

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

    const body = await request.json();
    const eventType = String(body.event_type ?? "");
    const sessionId = body.session_id ? String(body.session_id) : null;
    const itemId = body.item_id ? String(body.item_id) : null;

    if (!VALID_EVENTS.has(eventType)) {
      return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
    }

    if (eventType === "item_open" && itemId) {
      const item = await getItemById(itemId);
      if (!item || item.restaurant_id !== restaurant.id) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }
    }

    await query(
      `insert into menu_analytics_events (id, restaurant_id, item_id, event_type, session_id, metadata)
       values ($1, $2, $3, $4, $5, $6::jsonb)`,
      [
        randomUUID(),
        restaurant.id,
        itemId,
        eventType,
        sessionId,
        JSON.stringify(body.metadata ?? {}),
      ]
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to track analytics event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
