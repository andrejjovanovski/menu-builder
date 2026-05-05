import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdminSession } from "@/lib/server-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdminSession();
  if (error) {
    return error;
  }

  const { id } = await params;
  const body = await request.json();
  const entries = [
    ["expiration_date", body.expiration_date],
    ["notes", body.notes],
    ["status", body.status],
  ].filter(([, value]) => value !== undefined);

  if (entries.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const values = entries.map(([, value]) => value);
  values.push(id);

  const result = await query(
    `update payments
     set ${entries
       .map(([field], index) => `${field} = $${index + 1}`)
       .join(", ")}, updated_at = now()
     where id = $${values.length}
     returning *`,
    values
  );

  return NextResponse.json(result.rows[0]);
}
