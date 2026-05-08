import { query } from "@/lib/db";

export async function getRestaurantBySlug(slug: string) {
  const result = await query(
    "select * from restaurants where slug = $1 limit 1",
    [slug]
  );
  return result.rows[0] ?? null;
}

export async function getRestaurantById(id: string) {
  const result = await query("select * from restaurants where id = $1 limit 1", [id]);
  return result.rows[0] ?? null;
}

export async function getRestaurantCategories(restaurantId: string) {
  const result = await query(
    'select * from menu_categories where restaurant_id = $1 order by "order" asc, created_at asc',
    [restaurantId]
  );
  return result.rows;
}

export async function getRestaurantItems(restaurantId: string) {
  const result = await query(
    'select * from menu_items where restaurant_id = $1 order by "order" asc, created_at asc',
    [restaurantId]
  );
  return result.rows;
}

export async function getRestaurantItemsPaginated(
  restaurantId: string,
  { limit, offset }: { limit: number; offset: number }
) {
  const result = await query(
    'select * from menu_items where restaurant_id = $1 order by "order" asc, created_at asc limit $2 offset $3',
    [restaurantId, limit, offset]
  );
  return result.rows;
}

export async function getRestaurantItemsCount(restaurantId: string) {
  const result = await query(
    "select count(*)::int as count from menu_items where restaurant_id = $1",
    [restaurantId]
  );
  return result.rows[0]?.count ?? 0;
}

export async function getCategoryBySlug(restaurantId: string, slug: string) {
  const result = await query(
    "select * from menu_categories where restaurant_id = $1 and slug = $2 limit 1",
    [restaurantId, slug]
  );
  return result.rows[0] ?? null;
}

export async function getItemById(id: string) {
  const result = await query("select * from menu_items where id = $1 limit 1", [id]);
  return result.rows[0] ?? null;
}

export async function getActivePromotionsForRestaurant(restaurantId: string) {
  const result = await query(
    `select * from promotions
     where restaurant_id = $1
       and status = 'active'
       and valid_until > now()
     order by created_at asc`,
    [restaurantId]
  );
  return result.rows;
}

export async function getPromotionsForRestaurant(restaurantId: string) {
  const result = await query(
    "select * from promotions where restaurant_id = $1 order by created_at desc",
    [restaurantId]
  );
  return result.rows;
}

export async function getPromotionById(id: string) {
  const result = await query(
    "select p.*, r.owner_id from promotions p join restaurants r on r.id = p.restaurant_id where p.id = $1 limit 1",
    [id]
  );
  return result.rows[0] ?? null;
}
