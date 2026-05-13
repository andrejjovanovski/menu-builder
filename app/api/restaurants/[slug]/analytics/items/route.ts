import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getRestaurantBySlug } from "@/lib/repositories";
import { requireAppSession } from "@/lib/server-auth";
import { requireTier } from "@/lib/subscription";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { error, session } = await requireAppSession();
  if (error || !session) {
    return error;
  }

  const { slug } = await params;
  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  if (session.role !== "admin" && restaurant.owner_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tierGate = requireTier(restaurant, "pro");
  if (tierGate) {
    return tierGate;
  }

  const days = Number(request.nextUrl.searchParams.get("days") ?? "30");
  const safeDays = Number.isFinite(days) && days > 0 ? Math.min(days, 365) : 30;

  // Top items with 7d trend (compare current 7d window to previous 7d window).
  const topItems = await query<{
    item_id: string;
    item_name: string;
    category_name: string | null;
    total_opens: number;
    opens_7d: number;
    opens_prev_7d: number;
    upsell_taps: number;
  }>(
    `with windows as (
       select
         e.item_id,
         count(*) filter (where e.event_type = 'item_open' and e.created_at >= now() - ($2::text || ' days')::interval)::int as total_opens,
         count(*) filter (where e.event_type = 'item_open' and e.created_at >= now() - interval '7 days')::int as opens_7d,
         count(*) filter (where e.event_type = 'item_open' and e.created_at >= now() - interval '14 days' and e.created_at < now() - interval '7 days')::int as opens_prev_7d,
         count(*) filter (where e.event_type = 'upsell_tap')::int as upsell_taps
       from menu_analytics_events e
       where e.restaurant_id = $1
         and e.item_id is not null
       group by e.item_id
     )
     select
       w.item_id,
       coalesce(i.name, 'Deleted item') as item_name,
       c.name as category_name,
       w.total_opens,
       w.opens_7d,
       w.opens_prev_7d,
       w.upsell_taps
     from windows w
     left join menu_items i on i.id = w.item_id
     left join menu_categories c on c.id = i.category_id
     where w.total_opens > 0
     order by w.total_opens desc, item_name asc
     limit 20`,
    [restaurant.id, String(safeDays)]
  );

  // Low performers — items belonging to this restaurant with zero opens in `safeDays`.
  const lowPerformers = await query<{
    item_id: string;
    item_name: string;
    category_name: string | null;
    has_image: boolean;
    has_description: boolean;
    is_available: boolean;
  }>(
    `select
       i.id as item_id,
       i.name as item_name,
       c.name as category_name,
       (i.image_url is not null and length(i.image_url) > 0) as has_image,
       (i.description is not null and length(i.description) > 0) as has_description,
       i.is_available
     from menu_items i
     left join menu_categories c on c.id = i.category_id
     where i.restaurant_id = $1
       and not exists (
         select 1 from menu_analytics_events e
         where e.item_id = i.id
           and e.event_type = 'item_open'
           and e.created_at >= now() - ($2::text || ' days')::interval
       )
     order by i.created_at desc
     limit 10`,
    [restaurant.id, String(safeDays)]
  );

  // Category breakdown — opens grouped by category in window.
  const categoryBreakdown = await query<{
    category_id: string;
    category_name: string;
    opens: number;
  }>(
    `select
       c.id as category_id,
       c.name as category_name,
       count(e.id)::int as opens
     from menu_categories c
     left join menu_items i on i.category_id = c.id
     left join menu_analytics_events e on e.item_id = i.id
       and e.event_type = 'item_open'
       and e.created_at >= now() - ($2::text || ' days')::interval
     where c.restaurant_id = $1
     group by c.id, c.name
     order by opens desc, c.name asc`,
    [restaurant.id, String(safeDays)]
  );

  // Hour-of-day heatmap (0-23) for menu_view + item_open.
  const heatmap = await query<{ hour: number; opens: number; views: number }>(
    `select
       extract(hour from created_at)::int as hour,
       count(*) filter (where event_type = 'item_open')::int as opens,
       count(*) filter (where event_type = 'menu_view')::int as views
     from menu_analytics_events
     where restaurant_id = $1
       and created_at >= now() - ($2::text || ' days')::interval
     group by hour
     order by hour asc`,
    [restaurant.id, String(safeDays)]
  );

  // Upsell conversion (impressions vs taps) within window.
  const upsellResult = await query<{ impressions: number; taps: number }>(
    `select
       count(*) filter (where event_type = 'upsell_impression')::int as impressions,
       count(*) filter (where event_type = 'upsell_tap')::int as taps
     from menu_analytics_events
     where restaurant_id = $1
       and created_at >= now() - ($2::text || ' days')::interval`,
    [restaurant.id, String(safeDays)]
  );

  const upsell = upsellResult.rows[0] ?? { impressions: 0, taps: 0 };

  const topItemsWithTrend = topItems.rows.map((row) => {
    const delta = row.opens_7d - row.opens_prev_7d;
    let trend: "up" | "down" | "flat" = "flat";
    if (delta > 0) trend = "up";
    else if (delta < 0) trend = "down";
    return {
      item_id: row.item_id,
      item_name: row.item_name,
      category_name: row.category_name,
      total_opens: row.total_opens,
      opens_7d: row.opens_7d,
      opens_prev_7d: row.opens_prev_7d,
      upsell_taps: row.upsell_taps,
      trend,
      delta,
    };
  });

  // Fill heatmap to all 24 hours so the UI never has to handle gaps.
  const heatmapMap = new Map(heatmap.rows.map((row) => [row.hour, row]));
  const fullHeatmap = Array.from({ length: 24 }, (_, hour) => {
    const row = heatmapMap.get(hour);
    return {
      hour,
      opens: row?.opens ?? 0,
      views: row?.views ?? 0,
    };
  });

  return NextResponse.json({
    days: safeDays,
    topItems: topItemsWithTrend,
    lowPerformers: lowPerformers.rows,
    categoryBreakdown: categoryBreakdown.rows,
    heatmap: fullHeatmap,
    upsell: {
      impressions: upsell.impressions,
      taps: upsell.taps,
      conversion_rate:
        upsell.impressions > 0 ? upsell.taps / upsell.impressions : 0,
    },
  });
}
