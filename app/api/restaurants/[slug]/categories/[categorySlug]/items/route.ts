import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCategoryBySlug, getRestaurantBySlug } from "@/lib/repositories";
import { requireAppSession } from "@/lib/server-auth";

function normalizeTagArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; categorySlug: string }> }
) {
  const { slug, categorySlug } = await params;
  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const category = await getCategoryBySlug(restaurant.id, categorySlug);

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const result = await query(
    'select * from menu_items where category_id = $1 order by "order" asc, created_at asc',
    [category.id]
  );

  return NextResponse.json(result.rows);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; categorySlug: string }> }
) {
  const { error, session } = await requireAppSession();
  if (error || !session) {
    return error;
  }

  const { slug, categorySlug } = await params;
  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  if (session.role !== "admin" && restaurant.owner_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const category = await getCategoryBySlug(restaurant.id, categorySlug);

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const body = await request.json();
  const name = String(body.name ?? "").trim();

  if (!name || Number.isNaN(Number(body.price))) {
    return NextResponse.json(
      { error: "Name and valid price are required" },
      { status: 400 }
    );
  }

  const result = await query(
    `insert into menu_items (
      id, category_id, restaurant_id, name, description, price, image_url, dietary_tags, allergen_tags, is_available, "order"
    ) values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10, $11)
    returning *`,
    [
      randomUUID(),
      category.id,
      restaurant.id,
      name,
      body.description?.trim() || null,
      Number(body.price),
      body.image_url || null,
      JSON.stringify(normalizeTagArray(body.dietary_tags)),
      JSON.stringify(normalizeTagArray(body.allergen_tags)),
      body.is_available ?? true,
      body.order ?? 0,
    ]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}
