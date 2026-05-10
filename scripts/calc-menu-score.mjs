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

const POINTS = {
  imageCoverage: 25,
  descriptionCoverage: 15,
  hasBestSeller: 10,
  hasUpsell: 10,
  feedbackPositive: 15,
  lowPerformerPenalty: 15,
  hasMenuItems: 10,
  trafficSignal: 15,
};

async function calculateForRestaurant(restaurantId) {
  const itemsResult = await pool.query(
    `select
       i.id,
       (i.image_url is not null and length(i.image_url) > 0) as has_image,
       (i.description is not null and length(i.description) > 0) as has_description,
       i.is_best_seller,
       i.is_available,
       exists(select 1 from item_upsells u where u.item_id = i.id) as has_upsell,
       coalesce((
         select count(*) from menu_analytics_events e
         where e.item_id = i.id
           and e.event_type = 'item_open'
           and e.created_at >= now() - interval '30 days'
       ), 0)::int as opens_30d
     from menu_items i
     where i.restaurant_id = $1`,
    [restaurantId]
  );
  const items = itemsResult.rows;
  const itemCount = items.length;

  const feedback = (
    await pool.query(
      `select
         count(*) filter (where rating = 'love')::int as love,
         count(*)::int as total
       from menu_feedback_responses
       where restaurant_id = $1
         and created_at >= now() - interval '60 days'`,
      [restaurantId]
    )
  ).rows[0] ?? { love: 0, total: 0 };

  const menuViews = (
    await pool.query(
      `select count(*)::int as v
       from menu_analytics_events
       where restaurant_id = $1
         and event_type = 'menu_view'
         and created_at >= now() - interval '30 days'`,
      [restaurantId]
    )
  ).rows[0]?.v ?? 0;

  const itemsWithImages = items.filter((i) => i.has_image).length;
  const itemsWithDescriptions = items.filter((i) => i.has_description).length;
  const hasBestSeller = items.some((i) => i.is_best_seller);
  const hasUpsell = items.some((i) => i.has_upsell);
  const lowPerformersNoImage = items.filter(
    (i) => i.opens_30d === 0 && !i.has_image && i.is_available
  ).length;

  const imageRatio = itemCount > 0 ? itemsWithImages / itemCount : 0;
  const descRatio = itemCount > 0 ? itemsWithDescriptions / itemCount : 0;
  const lovedRatio = feedback.total > 0 ? feedback.love / feedback.total : 0;

  const breakdownItems = [
    { id: "menu_built", label: "Menu has items", points: POINTS.hasMenuItems, earned: itemCount > 0 ? POINTS.hasMenuItems : 0, detail: `${itemCount} items` },
    { id: "image_coverage", label: "Items with images", points: POINTS.imageCoverage, earned: Math.round(imageRatio * POINTS.imageCoverage), detail: `${itemsWithImages}/${itemCount} have images` },
    { id: "description_coverage", label: "Items with descriptions", points: POINTS.descriptionCoverage, earned: Math.round(descRatio * POINTS.descriptionCoverage), detail: `${itemsWithDescriptions}/${itemCount} have descriptions` },
    { id: "best_seller", label: "At least one Best Seller marked", points: POINTS.hasBestSeller, earned: hasBestSeller ? POINTS.hasBestSeller : 0 },
    { id: "upsell", label: "At least one upsell configured", points: POINTS.hasUpsell, earned: hasUpsell ? POINTS.hasUpsell : 0 },
    { id: "feedback", label: "Positive guest feedback", points: POINTS.feedbackPositive, earned: feedback.total >= 3 ? Math.round(lovedRatio * POINTS.feedbackPositive) : 0 },
    { id: "traffic", label: "Menu actively used", points: POINTS.trafficSignal, earned: menuViews >= 50 ? POINTS.trafficSignal : Math.round((menuViews / 50) * POINTS.trafficSignal) },
    { id: "low_performers", label: "Few hidden underperformers", points: POINTS.lowPerformerPenalty, earned: itemCount === 0 ? 0 : Math.max(0, POINTS.lowPerformerPenalty - Math.min(POINTS.lowPerformerPenalty, lowPerformersNoImage * 3)) },
  ];

  const total = Math.max(0, Math.min(100, breakdownItems.reduce((sum, item) => sum + item.earned, 0)));
  return { total, items: breakdownItems, suggestions: [] };
}

try {
  const restaurants = (
    await pool.query(
      `select id, name, slug from restaurants where subscription_tier in ('pro', 'business')`
    )
  ).rows;
  for (const r of restaurants) {
    const breakdown = await calculateForRestaurant(r.id);
    await pool.query(
      `update restaurants
       set menu_score = $1,
           menu_score_breakdown = $2::jsonb,
           menu_score_updated_at = now()
       where id = $3`,
      [breakdown.total, JSON.stringify(breakdown), r.id]
    );
    console.log(`[score] ${r.name} (${r.slug}): ${breakdown.total}/100`);
  }
  console.log(`Scored ${restaurants.length} restaurants.`);
} finally {
  await pool.end();
}
