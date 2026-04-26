import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getRestaurantBySlug } from "@/lib/repositories";
import { requireAppSession } from "@/lib/server-auth";

type Params = { params: Promise<{ slug: string; itemId: string }> };

// GET — returns upsell items for a given menu item (public, no auth)
// Falls back to auto-suggestions (same category, higher price) if no manual upsells set.
export async function GET(
  _request: NextRequest,
  { params }: Params
) {
  const { slug, itemId } = await params;

  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  // Fetch manual upsells
  const manualResult = await query(
    `SELECT i.id, i.name, i.description, i.price, i.image_url, i.is_available,
            'manual' AS source
     FROM item_upsells u
     JOIN menu_items i ON i.id = u.suggested_id
     WHERE u.item_id = $1 AND i.is_available = true
     ORDER BY u.position ASC
     LIMIT 3`,
    [itemId]
  );

  if (manualResult.rows.length > 0) {
    return NextResponse.json(manualResult.rows);
  }

  // Auto-fallback: same category, different item, higher price, top 3
  const autoResult = await query(
    `SELECT id, name, description, price, image_url, is_available,
            'auto' AS source
     FROM menu_items
     WHERE category_id = (SELECT category_id FROM menu_items WHERE id = $1)
       AND id != $1
       AND restaurant_id = $2
       AND is_available = true
     ORDER BY price DESC
     LIMIT 3`,
    [itemId, restaurant.id]
  );

  return NextResponse.json(autoResult.rows);
}

// POST — add an upsell suggestion (owner only)
export async function POST(
  request: NextRequest,
  { params }: Params
) {
  const { error, session } = await requireAppSession();
  if (error || !session) return error!;

  const { slug, itemId } = await params;

  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  if (session.role !== "admin" && restaurant.owner_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const suggestedId = body.suggested_id;
  const position = body.position ?? 0;

  if (!suggestedId) {
    return NextResponse.json({ error: "suggested_id is required" }, { status: 400 });
  }

  // Verify suggested item belongs to same restaurant
  const suggested = await query(
    "SELECT id FROM menu_items WHERE id = $1 AND restaurant_id = $2 LIMIT 1",
    [suggestedId, restaurant.id]
  );

  if (suggested.rows.length === 0) {
    return NextResponse.json({ error: "Suggested item not found" }, { status: 404 });
  }

  if (suggestedId === itemId) {
    return NextResponse.json({ error: "Cannot upsell an item to itself" }, { status: 400 });
  }

  // Enforce max 3 upsells per item
  const count = await query(
    "SELECT count(*) FROM item_upsells WHERE item_id = $1",
    [itemId]
  );
  if (parseInt(count.rows[0].count, 10) >= 3) {
    return NextResponse.json({ error: "Maximum 3 upsells per item" }, { status: 400 });
  }

  const result = await query(
    `INSERT INTO item_upsells (id, item_id, suggested_id, position)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (item_id, suggested_id) DO UPDATE SET position = EXCLUDED.position
     RETURNING *`,
    [randomUUID(), itemId, suggestedId, position]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}

// DELETE — remove an upsell suggestion (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: Params
) {
  const { error, session } = await requireAppSession();
  if (error || !session) return error!;

  const { slug, itemId } = await params;

  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  if (session.role !== "admin" && restaurant.owner_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const suggestedId = body.suggested_id;

  if (!suggestedId) {
    return NextResponse.json({ error: "suggested_id is required" }, { status: 400 });
  }

  await query(
    "DELETE FROM item_upsells WHERE item_id = $1 AND suggested_id = $2",
    [itemId, suggestedId]
  );

  return NextResponse.json({ success: true });
}
