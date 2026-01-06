import { notFound } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase'
import { MenuCategory, MenuItem } from '@/src/types'
import RestaurantMenuClient from '@/src/components/public-menu/RestaurantMenuClient'

interface CategoryWithItems extends MenuCategory {
  items: MenuItem[]
}

export default async function RestaurantPage({ params }: { params: Promise<{ restaurant: string }> }) {
  const { restaurant: slug } = await params
  const { data: restaurant, error } = await supabaseServer
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !restaurant) {
    notFound()
  }

  // Fetch all categories
  const { data: categories } = await supabaseServer
    .from('menu_categories')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .order('order')

  // Fetch all items for this restaurant
  const { data: allItems } = await supabaseServer
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('is_available', true)
    .order('order')

  // Group items by category
  const categoriesWithItems: CategoryWithItems[] = (categories || []).map(category => ({
    ...category,
    items: (allItems || []).filter(item => item.category_id === category.id)
  }))

  return <RestaurantMenuClient categoriesWithItems={categoriesWithItems} restaurant={restaurant} />
}

export async function generateMetadata({ params }: { params: Promise<{ restaurant: string }> }) {
  const { restaurant: slug } = await params
  const { data: restaurant } = await supabaseServer
    .from('restaurants')
    .select('name')
    .eq('slug', slug)
    .single()

  return {
    title: restaurant ? `${restaurant.name} Menu` : 'Restaurant Menu',
  }
}