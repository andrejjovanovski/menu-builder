import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getPromotionById } from "@/lib/repositories";
import { requireAppSession } from "@/lib/server-auth";

type Params = { params: Promise<{ slug: string; id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { error, session } = await requireAppSession();
  if (error || !session) return error!;

  const { id } = await params;
  const promo = await getPromotionById(id);

  if (!promo) {
    return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
  }

  if (session.role !== "admin" && promo.owner_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const entries: Array<[string, unknown]> = [];

  if (typeof body.image_url === "string" && body.image_url.trim()) {
    entries.push(["image_url", body.image_url.trim()]);
  }
  if (body.duration_seconds !== undefined) {
    const duration = Number(body.duration_seconds);
    if (!Number.isFinite(duration) || duration <= 0) {
      return NextResponse.json(
        { error: "duration_seconds must be a positive number" },
        { status: 400 }
      );
    }
    entries.push(["duration_seconds", Math.floor(duration)]);
  }
  if (typeof body.valid_until === "string") {
    if (Number.isNaN(Date.parse(body.valid_until))) {
      return NextResponse.json(
        { error: "valid_until must be an ISO timestamp" },
        { status: 400 }
      );
    }
    entries.push(["valid_until", body.valid_until]);
  }
  if (body.status === "active" || body.status === "inactive") {
    entries.push(["status", body.status]);
  }
  if (
    body.display_frequency === "once_per_session" ||
    body.display_frequency === "every_load"
  ) {
    entries.push(["display_frequency", body.display_frequency]);
  }

  if (entries.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const values = entries.map(([, value]) => value);
  values.push(id);

  const result = await query(
    `update promotions
     set ${entries.map(([field], index) => `${field} = $${index + 1}`).join(", ")},
         updated_at = now()
     where id = $${values.length}
     returning *`,
    values
  );

  return NextResponse.json(result.rows[0]);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { error, session } = await requireAppSession();
  if (error || !session) return error!;

  const { id } = await params;
  const promo = await getPromotionById(id);

  if (!promo) {
    return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
  }

  if (session.role !== "admin" && promo.owner_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await query("delete from promotions where id = $1", [id]);
  return NextResponse.json({ success: true });
}
