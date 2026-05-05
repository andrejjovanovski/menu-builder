import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getRestaurantBySlug } from "@/lib/repositories";
import { requireAppSession } from "@/lib/server-auth";

type Params = { params: Promise<{ slug: string }> };

// GET — list pending table requests (owner/admin only, for the live dashboard panel)
export async function GET(
  _request: NextRequest,
  { params }: Params
) {
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
    `SELECT * FROM table_requests
     WHERE restaurant_id = $1 AND status = 'pending'
     ORDER BY created_at DESC`,
    [restaurant.id]
  );

  return NextResponse.json(result.rows);
}

// POST — create a table request (public, no auth — called from the public menu)
export async function POST(
  request: NextRequest,
  { params }: Params
) {
  const { slug } = await params;
  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  if (!restaurant.call_waiter_enabled) {
    return NextResponse.json({ error: "Call waiter not enabled" }, { status: 403 });
  }

  const body = await request.json();
  const requestType = body.request_type;
  const tableIdentifier = body.table_identifier ? String(body.table_identifier).trim() : null;

  if (!["call_waiter", "ask_for_bill"].includes(requestType)) {
    return NextResponse.json({ error: "Invalid request_type" }, { status: 400 });
  }

  const result = await query(
    `INSERT INTO table_requests (id, restaurant_id, table_identifier, request_type)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [randomUUID(), restaurant.id, tableIdentifier, requestType]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}
