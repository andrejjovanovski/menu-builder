import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getRestaurantBySlug } from "@/lib/repositories";
import { requireAppSession } from "@/lib/server-auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  return NextResponse.json(restaurant);
}

export async function PATCH(
  request: NextRequest,
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

  const body = await request.json();
  const fields = [
    "name",
    "subtitle",
    "description",
    "logo_url",
    "est_year",
    "appearance",
    "background_color",
    "accent_color",
    "card_bg_color",
    "background_image_url",
    "slogan",
    "text_color",
    "muted_text_color",
    "footer_quote",
    "open_hours",
    "facebook_url",
    "instagram_url",
    "tiktok_url",
    "phone",
    "open_bottom_sheet_on_click",
    "recommendation_ai_enabled",
    "menu_filters_enabled",
    "feedback_enabled",
    "smart_highlights_enabled",
    "show_branding",
    "call_waiter_enabled",
    "category_cards_enabled",
    "font_pair_id",
    "qr_code_url",
  ] as const;

  const updates = fields
    .filter((field) => body[field] !== undefined)
    .map((field, index) => `${field} = $${index + 1}`);

  if (updates.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const values = fields
    .filter((field) => body[field] !== undefined)
    .map((field) => body[field]);

  values.push(slug);

  const result = await query(
    `update restaurants
     set ${updates.join(", ")}, updated_at = now()
     where slug = $${values.length}
     returning *`,
    values
  );

  return NextResponse.json(result.rows[0]);
}
