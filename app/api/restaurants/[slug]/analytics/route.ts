import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getRestaurantBySlug } from "@/lib/repositories";
import { requireAppSession } from "@/lib/server-auth";
import type { RestaurantAnalyticsSummary } from "@/src/types";

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

  const days = Number(request.nextUrl.searchParams.get("days") ?? "30");
  const safeDays = Number.isFinite(days) && days > 0 ? Math.min(days, 365) : 30;

  const totalsResult = await query<{
    menu_views: number;
    item_opens: number;
    recommendation_requests: number;
  }>(
    `select
       count(*) filter (where event_type = 'menu_view')::int as menu_views,
       count(*) filter (where event_type = 'item_open')::int as item_opens,
       count(*) filter (where event_type = 'recommendation_request')::int as recommendation_requests
     from menu_analytics_events
     where restaurant_id = $1
       and created_at >= now() - ($2::text || ' days')::interval`,
    [restaurant.id, String(safeDays)]
  );

  const feedbackResult = await query<{
    total: number;
    love: number;
    okay: number;
    hard_to_use: number;
  }>(
    `select
       count(*)::int as total,
       count(*) filter (where rating = 'love')::int as love,
       count(*) filter (where rating = 'okay')::int as okay,
       count(*) filter (where rating = 'hard_to_use')::int as hard_to_use
     from menu_feedback_responses
     where restaurant_id = $1
       and created_at >= now() - ($2::text || ' days')::interval`,
    [restaurant.id, String(safeDays)]
  );

  const topItemsResult = await query<{
    item_id: string;
    item_name: string;
    opens: number;
  }>(
    `select
       e.item_id,
       coalesce(i.name, 'Deleted item') as item_name,
       count(*)::int as opens
     from menu_analytics_events e
     left join menu_items i on i.id = e.item_id
     where e.restaurant_id = $1
       and e.event_type = 'item_open'
       and e.created_at >= now() - ($2::text || ' days')::interval
       and e.item_id is not null
     group by e.item_id, i.name
     order by opens desc, item_name asc
     limit 5`,
    [restaurant.id, String(safeDays)]
  );

  const totals = totalsResult.rows[0] ?? {
    menu_views: 0,
    item_opens: 0,
    recommendation_requests: 0,
  };
  const feedback = feedbackResult.rows[0] ?? {
    total: 0,
    love: 0,
    okay: 0,
    hard_to_use: 0,
  };

  const payload: RestaurantAnalyticsSummary = {
    totals: {
      menuViews: totals.menu_views,
      itemOpens: totals.item_opens,
      recommendationRequests: totals.recommendation_requests,
    },
    feedback: {
      total: feedback.total,
      love: feedback.love,
      okay: feedback.okay,
      hardToUse: feedback.hard_to_use,
    },
    topItems: topItemsResult.rows,
  };

  return NextResponse.json(payload);
}
