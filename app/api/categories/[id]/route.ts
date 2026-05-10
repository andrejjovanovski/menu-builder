import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAppSession } from "@/lib/server-auth";

async function getCategoryRecord(id: string) {
  const result = await query(
    `select c.*, r.owner_id
     from menu_categories c
     join restaurants r on r.id = c.restaurant_id
     where c.id = $1
     limit 1`,
    [id]
  );

  return result.rows[0] ?? null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAppSession();
  if (error || !session) {
    return error;
  }

  const { id } = await params;
  const category = await getCategoryRecord(id);

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  if (session.role !== "admin" && category.owner_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const entries = [
    ["name", body.name],
    ["slug", body.slug],
    ["order", body.order],
    ["image_url", body.image_url],
    ["description", body.description],
  ].filter(([, value]) => value !== undefined);

  if (entries.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  // Quote "order" since it's a reserved word; everything else is a plain identifier.
  const values = entries.map(([, value]) => value);
  values.push(id);

  const result = await query(
    `update menu_categories
     set ${entries
       .map(([field], index) => `"${field}" = $${index + 1}`)
       .join(", ")}, updated_at = now()
     where id = $${values.length}
     returning *`,
    values
  );

  return NextResponse.json(result.rows[0]);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAppSession();
  if (error || !session) {
    return error;
  }

  const { id } = await params;
  const category = await getCategoryRecord(id);

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  if (session.role !== "admin" && category.owner_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await query("delete from menu_categories where id = $1", [id]);
  return NextResponse.json({ success: true });
}
