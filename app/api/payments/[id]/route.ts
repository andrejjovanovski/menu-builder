import { NextRequest, NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import { requireAdminSession } from "@/lib/server-auth";
import type { SubscriptionTier } from "@/src/types";

const ALLOWED_TIERS: SubscriptionTier[] = ["basic", "pro", "business"];

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

  if (entries.length === 0 && body.tier === undefined) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const requestedTier = ALLOWED_TIERS.includes(body.tier) ? body.tier : null;

  return withTransaction(async (client) => {
    let updated;
    if (entries.length > 0) {
      const values = entries.map(([, value]) => value);
      values.push(id);

      const result = await client.query(
        `update payments
         set ${entries
           .map(([field], index) => `${field} = $${index + 1}`)
           .join(", ")}, updated_at = now()
         where id = $${values.length}
         returning *`,
        values
      );
      updated = result.rows[0];
    } else {
      const result = await client.query("select * from payments where id = $1", [id]);
      updated = result.rows[0];
    }

    if (!updated) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (updated.status === "active") {
      const tier: SubscriptionTier = requestedTier ?? "pro";
      await client.query(
        `update restaurants
         set subscription_tier = $1,
             show_branding = $2,
             updated_at = now()
         where id = $3`,
        [tier, tier === "basic", updated.restaurant_id]
      );
    } else {
      // Status flipped to expired/canceled — drop tier back to basic and show branding again,
      // but only if there isn't another active payment still covering this restaurant.
      const stillActive = await client.query(
        `select 1 from payments
         where restaurant_id = $1 and status = 'active' and expiration_date >= current_date
         limit 1`,
        [updated.restaurant_id]
      );
      if (stillActive.rowCount === 0) {
        await client.query(
          `update restaurants
           set subscription_tier = 'basic',
               show_branding = true,
               updated_at = now()
           where id = $1`,
          [updated.restaurant_id]
        );
      }
    }

    return NextResponse.json(updated);
  });
}
