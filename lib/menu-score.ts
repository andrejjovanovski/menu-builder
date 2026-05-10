import { query } from "@/lib/db";
import type { MenuScoreBreakdown } from "@/src/types";

type ScoreInput = {
  restaurantId: string;
};

type RawItem = {
  id: string;
  name: string;
  has_image: boolean;
  has_description: boolean;
  is_best_seller: boolean;
  is_available: boolean;
  has_upsell: boolean;
  opens_30d: number;
};

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

export async function calculateMenuScore({
  restaurantId,
}: ScoreInput): Promise<MenuScoreBreakdown> {
  const itemsResult = await query<RawItem>(
    `select
       i.id,
       i.name,
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

  const feedbackResult = await query<{ love: number; total: number }>(
    `select
       count(*) filter (where rating = 'love')::int as love,
       count(*)::int as total
     from menu_feedback_responses
     where restaurant_id = $1
       and created_at >= now() - interval '60 days'`,
    [restaurantId]
  );
  const feedback = feedbackResult.rows[0] ?? { love: 0, total: 0 };

  const trafficResult = await query<{ menu_views: number }>(
    `select count(*)::int as menu_views
     from menu_analytics_events
     where restaurant_id = $1
       and event_type = 'menu_view'
       and created_at >= now() - interval '30 days'`,
    [restaurantId]
  );
  const menuViews = trafficResult.rows[0]?.menu_views ?? 0;

  const itemsWithImages = items.filter((i) => i.has_image).length;
  const itemsWithDescriptions = items.filter((i) => i.has_description).length;
  const hasAtLeastOneBestSeller = items.some((i) => i.is_best_seller);
  const hasAtLeastOneUpsell = items.some((i) => i.has_upsell);
  const lowPerformersWithoutImage = items.filter(
    (i) => i.opens_30d === 0 && !i.has_image && i.is_available
  ).length;

  const imageRatio = itemCount > 0 ? itemsWithImages / itemCount : 0;
  const descRatio = itemCount > 0 ? itemsWithDescriptions / itemCount : 0;
  const lovedRatio = feedback.total > 0 ? feedback.love / feedback.total : 0;

  const breakdownItems: MenuScoreBreakdown["items"] = [
    {
      id: "menu_built",
      label: "Menu has items",
      points: POINTS.hasMenuItems,
      earned: itemCount > 0 ? POINTS.hasMenuItems : 0,
      detail: `${itemCount} item${itemCount === 1 ? "" : "s"}`,
    },
    {
      id: "image_coverage",
      label: "Items with images",
      points: POINTS.imageCoverage,
      earned: Math.round(imageRatio * POINTS.imageCoverage),
      detail: `${itemsWithImages}/${itemCount} have images`,
    },
    {
      id: "description_coverage",
      label: "Items with descriptions",
      points: POINTS.descriptionCoverage,
      earned: Math.round(descRatio * POINTS.descriptionCoverage),
      detail: `${itemsWithDescriptions}/${itemCount} have descriptions`,
    },
    {
      id: "best_seller",
      label: "At least one Best Seller marked",
      points: POINTS.hasBestSeller,
      earned: hasAtLeastOneBestSeller ? POINTS.hasBestSeller : 0,
    },
    {
      id: "upsell",
      label: "At least one upsell configured",
      points: POINTS.hasUpsell,
      earned: hasAtLeastOneUpsell ? POINTS.hasUpsell : 0,
    },
    {
      id: "feedback",
      label: "Positive guest feedback",
      points: POINTS.feedbackPositive,
      earned:
        feedback.total >= 3
          ? Math.round(lovedRatio * POINTS.feedbackPositive)
          : 0,
      detail:
        feedback.total >= 3
          ? `${feedback.love}/${feedback.total} loved it`
          : "Need at least 3 votes to score",
    },
    {
      id: "traffic",
      label: "Menu actively used",
      points: POINTS.trafficSignal,
      earned:
        menuViews >= 50
          ? POINTS.trafficSignal
          : Math.round((menuViews / 50) * POINTS.trafficSignal),
      detail: `${menuViews} views in 30d`,
    },
    {
      id: "low_performers",
      label: "Few hidden underperformers",
      points: POINTS.lowPerformerPenalty,
      earned:
        itemCount === 0
          ? 0
          : Math.max(
              0,
              POINTS.lowPerformerPenalty -
                Math.min(POINTS.lowPerformerPenalty, lowPerformersWithoutImage * 3)
            ),
      detail:
        lowPerformersWithoutImage > 0
          ? `${lowPerformersWithoutImage} items have no image and zero views`
          : "All items have either an image or some traffic",
    },
  ];

  const total = breakdownItems.reduce((sum, item) => sum + item.earned, 0);

  const suggestions: MenuScoreBreakdown["suggestions"] = [];
  if (imageRatio < 1 && itemCount > 0) {
    suggestions.push({
      id: "add_images",
      message: `Add images to ${itemCount - itemsWithImages} more item${itemCount - itemsWithImages === 1 ? "" : "s"}.`,
      href: "/dashboard/menu-builder",
    });
  }
  if (descRatio < 1 && itemCount > 0) {
    suggestions.push({
      id: "add_descriptions",
      message: `Write descriptions for ${itemCount - itemsWithDescriptions} more item${itemCount - itemsWithDescriptions === 1 ? "" : "s"}.`,
      href: "/dashboard/menu-builder",
    });
  }
  if (!hasAtLeastOneBestSeller) {
    suggestions.push({
      id: "mark_best_seller",
      message: "Mark at least one item as Best Seller to highlight it on the menu.",
      href: "/dashboard/menu-builder",
    });
  }
  if (!hasAtLeastOneUpsell) {
    suggestions.push({
      id: "configure_upsell",
      message: "Configure an upsell pairing on a popular item to lift order value.",
      href: "/dashboard/menu-builder",
    });
  }
  if (lowPerformersWithoutImage > 0) {
    suggestions.push({
      id: "fix_low_performers",
      message: `${lowPerformersWithoutImage} item${lowPerformersWithoutImage === 1 ? "" : "s"} have no image and zero views. Add an image or hide them.`,
      href: "/dashboard/menu-builder",
    });
  }
  if (feedback.total < 3) {
    suggestions.push({
      id: "collect_feedback",
      message: "Encourage guests to leave feedback — you need at least 3 votes for the feedback score.",
    });
  }

  return {
    total: Math.max(0, Math.min(100, total)),
    items: breakdownItems,
    suggestions,
  };
}

export async function persistMenuScore(restaurantId: string) {
  const breakdown = await calculateMenuScore({ restaurantId });
  await query(
    `update restaurants
     set menu_score = $1,
         menu_score_breakdown = $2::jsonb,
         menu_score_updated_at = now()
     where id = $3`,
    [breakdown.total, JSON.stringify(breakdown), restaurantId]
  );
  return breakdown;
}
