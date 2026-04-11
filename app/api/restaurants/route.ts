import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAppSession } from "@/lib/server-auth";

export async function GET() {
  const { error, session } = await requireAppSession();
  if (error || !session) {
    return error;
  }

  const values: unknown[] = [];
  let sql = "select * from restaurants";

  if (session.role !== "admin") {
    sql += " where owner_id = $1";
    values.push(session.user.id);
  }

  sql += " order by created_at desc";

  const result = await query(sql, values);
  return NextResponse.json(result.rows);
}

export async function POST(request: NextRequest) {
  const { error, session } = await requireAppSession();
  if (error || !session) {
    return error;
  }

  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const slug = String(body.slug ?? "").trim();

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    const result = await query(
      `insert into restaurants (
        id, name, slug, subtitle, description, owner_id, logo_url, est_year, appearance,
        background_color, accent_color, card_bg_color, background_image_url, slogan,
        text_color, muted_text_color, footer_quote, open_hours, facebook_url,
        instagram_url, tiktok_url, phone, open_bottom_sheet_on_click,
        recommendation_ai_enabled, menu_filters_enabled, feedback_enabled
      ) values (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24, $25, $26
      ) returning *`,
      [
        randomUUID(),
        name,
        slug,
        body.subtitle?.trim() || null,
        body.description?.trim() || null,
        session.user.id,
        body.logo_url || null,
        body.est_year || null,
        body.appearance || "minimal",
        body.background_color || "#ffffff",
        body.accent_color || "#6366f1",
        body.card_bg_color || "#ffffff",
        body.background_image_url || null,
        body.slogan || null,
        body.text_color || "#000000",
        body.muted_text_color || "#6b7280",
        body.footer_quote || null,
        body.open_hours || null,
        body.facebook_url || null,
        body.instagram_url || null,
        body.tiktok_url || null,
        body.phone || null,
        body.open_bottom_sheet_on_click ?? true,
        body.recommendation_ai_enabled ?? true,
        body.menu_filters_enabled ?? true,
        body.feedback_enabled ?? true,
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create restaurant";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
