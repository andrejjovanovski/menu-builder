import { NextRequest, NextResponse } from "next/server";
import { getRestaurantBySlug, getRestaurantCategories, getRestaurantItems } from "@/lib/repositories";
import { getOpenAIClient, getRecommendationModel } from "@/lib/openai";
import type { MenuCategory, MenuItem, Restaurant } from "@/src/types";

function buildMenuContext(
  restaurant: Restaurant,
  categories: MenuCategory[],
  items: MenuItem[]
) {
  const grouped = categories.map((category) => {
    const categoryItems = items.filter((item) => item.category_id === category.id);
    return {
      category: category.name,
      items: categoryItems.map((item) => ({
        name: item.name,
        description: item.description || "",
        price: item.price,
        dietary_tags: item.dietary_tags || [],
        allergen_tags: item.allergen_tags || [],
        available: item.is_available !== false,
      })),
    };
  });

  return JSON.stringify(
    {
      restaurant: {
        name: restaurant.name,
        subtitle: restaurant.subtitle || "",
        description: restaurant.description || "",
      },
      menu: grouped,
    },
    null,
    2
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const question = String(body.question ?? "").trim();

    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const restaurant = (await getRestaurantBySlug(slug)) as Restaurant | null;
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    if (restaurant.recommendation_ai_enabled === false) {
      return NextResponse.json(
        { error: "Recommendations are disabled for this restaurant" },
        { status: 403 }
      );
    }

    const [categories, items] = (await Promise.all([
      getRestaurantCategories(restaurant.id),
      getRestaurantItems(restaurant.id),
    ])) as [MenuCategory[], MenuItem[]];

    const availableItems = items.filter((item) => item.is_available !== false);
    if (availableItems.length === 0) {
      return NextResponse.json(
        { error: "This restaurant has no available menu items yet" },
        { status: 400 }
      );
    }

    const client = getOpenAIClient();
    const response = await client.responses.create({
      model: getRecommendationModel(),
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "You are a restaurant menu recommendation assistant inside a menu app. Use only the provided menu. Do not invent dishes, ingredients, prices, or availability. Give concise, friendly recommendations. Mention exact dish names from the menu. If the menu does not contain a good match, say that clearly and suggest the closest options.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Restaurant menu context:\n${buildMenuContext(restaurant, categories, availableItems)}\n\nCustomer question: ${question}\n\nAnswer in 3 short parts:\n1. Best pick\n2. 1-2 alternatives\n3. Brief reason based on the menu only`,
            },
          ],
        },
      ],
    });

    const answer = response.output_text?.trim();

    if (!answer) {
      return NextResponse.json(
        { error: "No recommendation was generated" },
        { status: 500 }
      );
    }

    return NextResponse.json({ answer });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate recommendation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
