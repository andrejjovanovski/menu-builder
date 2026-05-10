import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getRestaurantBySlug } from "@/lib/repositories";
import { requireAppSession } from "@/lib/server-auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const result = await query(
    'select * from menu_categories where restaurant_id = $1 order by "order" asc, created_at asc',
    [restaurant.id]
  );

  return NextResponse.json(result.rows);
}

export async function POST(
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
  const name = String(body.name ?? "").trim();
  const categorySlug = String(body.slug ?? "").trim();

  if (!name || !categorySlug) {
    return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
  }

  const imageUrl =
    typeof body.image_url === "string" && body.image_url.trim().length > 0
      ? body.image_url.trim()
      : null;
  const description =
    typeof body.description === "string" && body.description.trim().length > 0
      ? body.description.trim()
      : null;

  const result = await query(
    `insert into menu_categories (id, restaurant_id, name, slug, image_url, description, "order")
     values ($1, $2, $3, $4, $5, $6, $7)
     returning *`,
    [randomUUID(), restaurant.id, name, categorySlug, imageUrl, description, body.order ?? 0]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}
