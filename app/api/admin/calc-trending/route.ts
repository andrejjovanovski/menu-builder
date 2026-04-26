import { NextResponse } from "next/server";
import { query, withTransaction } from "@/lib/db";
import { requireAdminSession } from "@/lib/server-auth";

// POST — trigger trending calculation for all restaurants (admin only)
export async function POST() {
  const { error } = await requireAdminSession();
  if (error) return error;

  const restaurantsResult = await query("SELECT id, name FROM restaurants");
  const restaurants = restaurantsResult.rows;

  const results: Array<{ name: string; marked: number }> = [];

  for (const restaurant of restaurants) {
    const marked = await withTransaction(async (client) => {
      // Reset all
      await client.query(
        "UPDATE menu_items SET is_trending = false WHERE restaurant_id = $1",
        [restaurant.id]
      );

      const countResult = await client.query(
        "SELECT count(*) FROM menu_items WHERE restaurant_id = $1",
        [restaurant.id]
      );
      const totalItems = parseInt(countResult.rows[0].count, 10);
      if (totalItems === 0) return 0;

      const topN = Math.max(3, Math.ceil(totalItems * 0.1));

      const result = await client.query(
        `UPDATE menu_items
         SET is_trending = true
         WHERE id IN (
           SELECT item_id
           FROM menu_analytics_events
           WHERE restaurant_id = $1
             AND event_type = 'item_open'
             AND created_at > now() - interval '7 days'
             AND item_id IS NOT NULL
           GROUP BY item_id
           ORDER BY count(*) DESC
           LIMIT $2
         )
         RETURNING id`,
        [restaurant.id, topN]
      );

      return result.rowCount ?? 0;
    });

    results.push({ name: restaurant.name, marked });
  }

  return NextResponse.json({ success: true, results });
}
