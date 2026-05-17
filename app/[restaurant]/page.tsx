import { cache } from 'react'
import { notFound } from 'next/navigation'
import {
  getActivePromotionsForRestaurant,
  getRestaurantBySlug,
  getRestaurantCategories,
  getRestaurantItems,
} from '@/lib/repositories'
import { MenuCategory, MenuItem, Promotion, Restaurant } from '@/src/types'
import RestaurantMenuClient from '@/src/components/public-menu/RestaurantMenuClient'
import { ALL_FONTS_CLASS } from '@/src/utils/theme-fonts'

interface CategoryWithItems extends MenuCategory {
  items: MenuItem[]
}

const getRestaurantBySlugCached = cache(getRestaurantBySlug)

export default async function RestaurantPage({ params }: { params: Promise<{ restaurant: string }> }) {
  const { restaurant: slug } = await params
  const restaurant = await getRestaurantBySlugCached(slug) as Restaurant | null

  if (!restaurant) {
    notFound()
  }

  const [categories, allItems, promotions] = await Promise.all([
    getRestaurantCategories(restaurant.id),
    getRestaurantItems(restaurant.id),
    getActivePromotionsForRestaurant(restaurant.id),
  ]) as [MenuCategory[], MenuItem[], Promotion[]]

  const itemsByCategoryId = new Map<string, MenuItem[]>()
  for (const item of allItems || []) {
    const categoryItems = itemsByCategoryId.get(item.category_id)
    if (categoryItems) {
      categoryItems.push(item)
      continue
    }

    itemsByCategoryId.set(item.category_id, [item])
  }

  const categoriesWithItems: CategoryWithItems[] = (categories || []).map((category) => ({
    ...category,
    items: itemsByCategoryId.get(category.id) ?? [],
  }))

  return (
    <div className={ALL_FONTS_CLASS}>
      <RestaurantMenuClient
        categoriesWithItems={categoriesWithItems}
        restaurant={restaurant}
        promotions={promotions || []}
      />
    </div>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ restaurant: string }> }) {
  const { restaurant: slug } = await params
  const restaurant = await getRestaurantBySlugCached(slug)

  return {
    title: restaurant ? `${restaurant.name} Menu` : 'Restaurant Menu',
  }
}
