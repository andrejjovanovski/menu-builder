import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireAdminSession } from "@/lib/server-auth";

export async function GET() {
  const { error } = await requireAdminSession();
  if (error) {
    return error;
  }

  const result = await query("select * from payments order by created_at desc");
  return NextResponse.json(result.rows);
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdminSession();
  if (error) {
    return error;
  }

  const body = await request.json();
  if (!body.restaurant_id || !body.expiration_date) {
    return NextResponse.json(
      { error: "restaurant_id and expiration_date are required" },
      { status: 400 }
    );
  }

  const result = await query(
    `insert into payments (id, restaurant_id, expiration_date, notes, status)
     values ($1, $2, $3, $4, $5)
     returning *`,
    [
      randomUUID(),
      body.restaurant_id,
      body.expiration_date,
      body.notes ?? null,
      body.status ?? "active",
    ]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}
