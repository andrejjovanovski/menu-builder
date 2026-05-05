import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getRestaurantBySlug } from "@/lib/repositories";
import { requireAppSession } from "@/lib/server-auth";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { error, session } = await requireAppSession();
  if (error || !session) return error!;

  const { slug } = await params;
  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  if (session.role !== "admin" && restaurant.owner_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await query(
    `select * from promotions where restaurant_id = $1 order by created_at desc`,
    [restaurant.id]
  );

  return NextResponse.json(result.rows);
}

export async function POST(request: NextRequest, { params }: Params) {
  const { error, session } = await requireAppSession();
  if (error || !session) return error!;

  const { slug } = await params;
  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  if (session.role !== "admin" && restaurant.owner_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const imageUrl = typeof body.image_url === "string" ? body.image_url.trim() : "";
  const duration = Number(body.duration_seconds);
  const validUntil = typeof body.valid_until === "string" ? body.valid_until : null;
  const status = body.status === "inactive" ? "inactive" : "active";
  const displayFrequency =
    body.display_frequency === "every_load" ? "every_load" : "once_per_session";

  if (!imageUrl) {
    return NextResponse.json({ error: "image_url required" }, { status: 400 });
  }
  if (!Number.isFinite(duration) || duration <= 0) {
    return NextResponse.json(
      { error: "duration_seconds must be a positive number" },
      { status: 400 }
    );
  }
  if (!validUntil || Number.isNaN(Date.parse(validUntil))) {
    return NextResponse.json(
      { error: "valid_until must be an ISO timestamp" },
      { status: 400 }
    );
  }

  const result = await query(
    `insert into promotions
       (id, restaurant_id, image_url, duration_seconds, valid_until, status, display_frequency)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning *`,
    [
      randomUUID(),
      restaurant.id,
      imageUrl,
      Math.floor(duration),
      validUntil,
      status,
      displayFrequency,
    ]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}
