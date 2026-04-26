import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getRestaurantBySlug } from "@/lib/repositories";
import { requireAppSession } from "@/lib/server-auth";

type Params = { params: Promise<{ slug: string; id: string }> };

// PATCH — mark a table request as done (owner/admin only)
export async function PATCH(
  _request: NextRequest,
  { params }: Params
) {
  const { error, session } = await requireAppSession();
  if (error || !session) return error!;

  const { slug, id } = await params;
  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  if (session.role !== "admin" && restaurant.owner_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await query(
    `UPDATE table_requests
     SET status = 'done'
     WHERE id = $1 AND restaurant_id = $2
     RETURNING *`,
    [id, restaurant.id]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}
