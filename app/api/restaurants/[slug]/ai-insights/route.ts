import { NextRequest, NextResponse } from "next/server";
import { query, withTransaction } from "@/lib/db";
import { getRestaurantBySlug } from "@/lib/repositories";
import { getOpenAIClient, getRecommendationModel } from "@/lib/openai";
import { requireAppSession } from "@/lib/server-auth";
import { requireTier } from "@/lib/subscription";
import type { AiInsight } from "@/src/types";

const RECOMMENDATION_TYPES = [
  "add_image",
  "add_description",
  "promote",
  "consider_removing",
  "general",
] as const;

const INSIGHT_TTL_HOURS = 24;
const MAX_INSIGHTS = 5;

type ItemSnapshot = {
  id: string;
  name: string;
  category: string | null;
  has_image: boolean;
  has_description: boolean;
  price: number;
  is_best_seller: boolean;
  is_new: boolean;
  is_available: boolean;
  opens_30d: number;
  opens_7d: number;
};

async function getInsights(restaurantId: string) {
  const result = await query<AiInsight>(
    `select * from restaurant_ai_insights
     where restaurant_id = $1 and status = 'open'
     order by priority desc, generated_at desc
     limit 20`,
    [restaurantId]
  );
  return result.rows;
}

async function loadSnapshot(restaurantId: string): Promise<ItemSnapshot[]> {
  const result = await query<ItemSnapshot>(
    `select
       i.id,
       i.name,
       c.name as category,
       (i.image_url is not null and length(i.image_url) > 0) as has_image,
       (i.description is not null and length(i.description) > 0) as has_description,
       i.price::float as price,
       i.is_best_seller,
       i.is_new,
       i.is_available,
       coalesce((
         select count(*) from menu_analytics_events e
         where e.item_id = i.id and e.event_type = 'item_open'
           and e.created_at >= now() - interval '30 days'
       ), 0)::int as opens_30d,
       coalesce((
         select count(*) from menu_analytics_events e
         where e.item_id = i.id and e.event_type = 'item_open'
           and e.created_at >= now() - interval '7 days'
       ), 0)::int as opens_7d
     from menu_items i
     left join menu_categories c on c.id = i.category_id
     where i.restaurant_id = $1
     order by opens_30d desc, i.created_at desc
     limit 60`,
    [restaurantId]
  );
  return result.rows;
}

async function generateAndStoreInsights(restaurantId: string, restaurantName: string) {
  const items = await loadSnapshot(restaurantId);
  if (items.length === 0) {
    return [];
  }

  const client = getOpenAIClient();
  const promptItems = items.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    price: item.price,
    has_image: item.has_image,
    has_description: item.has_description,
    is_best_seller: item.is_best_seller,
    is_new: item.is_new,
    is_available: item.is_available,
    opens_30d: item.opens_30d,
    opens_7d: item.opens_7d,
  }));

  const response = await client.responses.create({
    model: getRecommendationModel(),
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "You are an analyst inside a restaurant menu management app. Read the item snapshot and produce concrete, actionable recommendations the OWNER can execute today. Focus on revenue: what to promote, what is missing, what should be hidden. Output strict JSON only — no prose around it.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Restaurant: ${restaurantName}

Menu snapshot (item-level analytics for the last 30 and 7 days):
${JSON.stringify(promptItems, null, 2)}

Return a JSON object of the form:
{
  "insights": [
    {
      "item_id": "<uuid or null>",
      "recommendation_type": "add_image" | "add_description" | "promote" | "consider_removing" | "general",
      "message": "Imperative short sentence the owner can act on.",
      "priority": 1-5
    }
  ]
}

Rules:
- Maximum ${MAX_INSIGHTS} insights, sorted with the most impactful first.
- Use real item ids from the snapshot.
- Each message under 140 characters.
- "promote" must reference items with rising or strong opens_7d.
- "consider_removing" must reference items with 0 opens in 30 days AND no image.
- "add_image" / "add_description" must target items missing those fields.
- Do not repeat the same item more than twice.`,
          },
        ],
      },
    ],
  });

  const text = response.output_text?.trim() ?? "";

  // Try to parse JSON tolerantly — sometimes models wrap in markdown fences.
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  let parsed: { insights?: Array<Record<string, unknown>> } = {};
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    parsed = {};
  }

  const validInsights = (parsed.insights ?? [])
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => {
      const rawType = String(entry.recommendation_type ?? "general");
      const recommendationType = (RECOMMENDATION_TYPES as readonly string[]).includes(rawType)
        ? rawType
        : "general";
      const itemId = typeof entry.item_id === "string" ? entry.item_id : null;
      const message = String(entry.message ?? "").trim();
      const priorityNum = Number(entry.priority);
      const priority = Number.isFinite(priorityNum)
        ? Math.max(0, Math.min(5, Math.round(priorityNum)))
        : 0;
      return { itemId, recommendationType, message, priority };
    })
    .filter((entry) => entry.message.length > 0)
    .slice(0, MAX_INSIGHTS);

  return withTransaction(async (client) => {
    // Replace previous open insights with the freshly generated batch.
    await client.query(
      `delete from restaurant_ai_insights where restaurant_id = $1 and status = 'open'`,
      [restaurantId]
    );

    for (const insight of validInsights) {
      await client.query(
        `insert into restaurant_ai_insights
           (restaurant_id, item_id, recommendation_type, message, priority)
         values ($1, $2, $3, $4, $5)`,
        [
          restaurantId,
          insight.itemId,
          insight.recommendationType,
          insight.message,
          insight.priority,
        ]
      );
    }

    const result = await client.query<AiInsight>(
      `select * from restaurant_ai_insights
       where restaurant_id = $1 and status = 'open'
       order by priority desc, generated_at desc`,
      [restaurantId]
    );
    return result.rows;
  });
}

export async function GET(
  _request: NextRequest,
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
  const tierGate = requireTier(restaurant, "business");
  if (tierGate) return tierGate;

  const insights = await getInsights(restaurant.id);

  // Auto-generate if there's nothing fresh.
  const newest = insights[0];
  const isStale =
    !newest ||
    Date.now() - new Date(newest.generated_at).getTime() > 1000 * 60 * 60 * INSIGHT_TTL_HOURS;

  if (isStale) {
    try {
      const generated = await generateAndStoreInsights(restaurant.id, restaurant.name);
      return NextResponse.json({ insights: generated, generated_at: new Date().toISOString() });
    } catch (err) {
      console.error("Failed to generate AI insights", err);
      return NextResponse.json({ insights, generated_at: newest?.generated_at ?? null });
    }
  }

  return NextResponse.json({ insights, generated_at: newest?.generated_at ?? null });
}

export async function POST(
  _request: NextRequest,
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
  const tierGate = requireTier(restaurant, "business");
  if (tierGate) return tierGate;

  try {
    const insights = await generateAndStoreInsights(restaurant.id, restaurant.name);
    return NextResponse.json({ insights, generated_at: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate insights";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
