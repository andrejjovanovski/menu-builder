import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAppSession } from "@/lib/server-auth";

function normalizeTagArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

async function getItemRecord(id: string) {
  const result = await query(
    `select i.*, r.owner_id
     from menu_items i
     join restaurants r on r.id = i.restaurant_id
     where i.id = $1
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
  const item = await getItemRecord(id);

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  if (session.role !== "admin" && item.owner_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const entries = [
    ["name", body.name],
    ["description", body.description],
    ["price", body.price],
    ["category_id", body.category_id],
    ["is_available", body.is_available],
    ["is_best_seller", body.is_best_seller],
    ["is_new", body.is_new],
    ["image_url", body.image_url],
    ["dietary_tags", body.dietary_tags !== undefined ? JSON.stringify(normalizeTagArray(body.dietary_tags)) : undefined],
    ["allergen_tags", body.allergen_tags !== undefined ? JSON.stringify(normalizeTagArray(body.allergen_tags)) : undefined],
    ["order", body.order],
  ].filter(([, value]) => value !== undefined);

  if (entries.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const values = entries.map(([, value]) => value);
  values.push(id);

  const result = await query(
    `update menu_items
     set ${entries
       .map(([field], index) =>
         field === "dietary_tags" || field === "allergen_tags"
           ? `${field} = $${index + 1}::jsonb`
           : `${field} = $${index + 1}`
       )
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
  const item = await getItemRecord(id);

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  if (session.role !== "admin" && item.owner_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await query("delete from menu_items where id = $1", [id]);
  return NextResponse.json({ success: true });
}
