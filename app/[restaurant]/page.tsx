import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getRestaurantBySlug, getRestaurantCategories, getRestaurantItems } from '@/lib/repositories'
import { MenuCategory, MenuItem, Restaurant } from '@/src/types'
import RestaurantMenuClient from '@/src/components/public-menu/RestaurantMenuClient'

interface CategoryWithItems extends MenuCategory {
  items: MenuItem[]
}

export default async function RestaurantPage({ params }: { params: Promise<{ restaurant: string }> }) {
  const { restaurant: slug } = await params
  const restaurant = await getRestaurantBySlug(slug) as Restaurant | null

  if (!restaurant) {
    notFound()
  }

  const [categories, allItems] = await Promise.all([
    getRestaurantCategories(restaurant.id),
    getRestaurantItems(restaurant.id),
  ]) as [MenuCategory[], MenuItem[]]

  const categoriesWithItems: CategoryWithItems[] = (categories || []).map((category) => ({
    ...category,
    items: (allItems || []).filter((item) => item.category_id === category.id),
  }))

  return (
    <Suspense>
      <RestaurantMenuClient categoriesWithItems={categoriesWithItems} restaurant={restaurant} />
    </Suspense>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ restaurant: string }> }) {
  const { restaurant: slug } = await params
  const restaurant = await getRestaurantBySlug(slug)

  return {
    title: restaurant ? `${restaurant.name} Menu` : 'Restaurant Menu',
  }
}
