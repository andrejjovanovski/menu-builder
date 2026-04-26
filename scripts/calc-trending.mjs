/**
 * Trending item calculation script.
 * Run nightly: npm run db:calc-trending
 *
 * Marks the top 10% of items (min 3) per restaurant as `is_trending = true`
 * based on `item_open` events in the last 7 days. Resets all others to false.
 */
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config({ path: ".env.local" });
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_SSL === "disable"
      ? false
      : process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
});

async function calcTrendingForRestaurant(restaurantId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Reset all items for this restaurant
    await client.query(
      "UPDATE menu_items SET is_trending = false WHERE restaurant_id = $1",
      [restaurantId]
    );

    // Count total items
    const countResult = await client.query(
      "SELECT count(*) FROM menu_items WHERE restaurant_id = $1",
      [restaurantId]
    );
    const totalItems = parseInt(countResult.rows[0].count, 10);

    if (totalItems === 0) {
      await client.query("COMMIT");
      return 0;
    }

    const topN = Math.max(3, Math.ceil(totalItems * 0.1));

    // Mark top N items by item_open events in last 7 days as trending
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
      [restaurantId, topN]
    );

    await client.query("COMMIT");
    return result.rowCount ?? 0;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function run() {
  const restaurantsResult = await pool.query("SELECT id, name FROM restaurants");
  const restaurants = restaurantsResult.rows;

  console.log(`Processing ${restaurants.length} restaurants...`);

  for (const restaurant of restaurants) {
    try {
      const marked = await calcTrendingForRestaurant(restaurant.id);
      console.log(`  ${restaurant.name}: ${marked} items marked as trending`);
    } catch (err) {
      console.error(`  ${restaurant.name}: ERROR — ${err.message}`);
    }
  }

  console.log("Done.");
}

try {
  await run();
} finally {
  await pool.end();
}
