import { NextRequest, NextResponse } from "next/server";
import {
  getRestaurantBySlug,
  getRestaurantItems,
  getRestaurantItemsCount,
  getRestaurantItemsPaginated,
} from "@/lib/repositories";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");

  if (limitParam === null && offsetParam === null) {
    const items = await getRestaurantItems(restaurant.id);
    return NextResponse.json({
      items,
      total: items.length,
      hasMore: false,
    });
  }

  const parsedLimit = Number(limitParam ?? DEFAULT_LIMIT);
  const parsedOffset = Number(offsetParam ?? 0);
  const limit = Number.isFinite(parsedLimit)
    ? Math.min(Math.max(Math.trunc(parsedLimit), 1), MAX_LIMIT)
    : DEFAULT_LIMIT;
  const offset = Number.isFinite(parsedOffset)
    ? Math.max(Math.trunc(parsedOffset), 0)
    : 0;

  const [items, total] = await Promise.all([
    getRestaurantItemsPaginated(restaurant.id, { limit, offset }),
    getRestaurantItemsCount(restaurant.id),
  ]);

  return NextResponse.json({
    items,
    total,
    hasMore: offset + items.length < total,
  });
}
