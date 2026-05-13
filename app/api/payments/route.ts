import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { query, withTransaction } from "@/lib/db";
import { requireAdminSession } from "@/lib/server-auth";
import type { SubscriptionTier } from "@/src/types";

const ALLOWED_TIERS: SubscriptionTier[] = ["basic", "pro", "business"];

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

  const status = body.status ?? "active";
  const requestedTier = ALLOWED_TIERS.includes(body.tier) ? body.tier : null;

  return withTransaction(async (client) => {
    const insert = await client.query(
      `insert into payments (id, restaurant_id, expiration_date, notes, status)
       values ($1, $2, $3, $4, $5)
       returning *`,
      [
        randomUUID(),
        body.restaurant_id,
        body.expiration_date,
        body.notes ?? null,
        status,
      ]
    );

    if (status === "active") {
      const tier: SubscriptionTier = requestedTier ?? "pro";
      await client.query(
        `update restaurants
         set subscription_tier = $1,
             show_branding = $2,
             updated_at = now()
         where id = $3`,
        [tier, tier === "basic", body.restaurant_id]
      );
    }

    return NextResponse.json(insert.rows[0], { status: 201 });
  });
}
