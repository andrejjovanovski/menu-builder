import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getCategoryBySlug, getRestaurantBySlug } from '@/lib/repositories'
import { query } from '@/lib/db'
import { MenuItem, Restaurant, MenuCategory } from '@/src/types'

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ restaurant: string; category: string }>
}) {
  const { restaurant: restSlug, category: catSlug } = await params
  const restaurant = await getRestaurantBySlug(restSlug) as Restaurant | null

  if (!restaurant) {
    notFound()
  }

  const category = await getCategoryBySlug(restaurant.id, catSlug) as MenuCategory | null

  if (!category) {
    notFound()
  }

  const itemsResult = await query<MenuItem>(
    'select * from menu_items where category_id = $1 and is_available = true order by "order" asc, created_at asc',
    [category.id]
  )

  const items = itemsResult.rows

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href={`/${restaurant.slug}`} className="text-blue-600 hover:text-blue-800">
                ← Back to {restaurant.name}
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">{category.name}</h1>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items?.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {item.image_url && (
                <div className="relative h-48">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.name}</h3>
                {item.description && (
                  <p className="text-gray-600 mb-4">{item.description}</p>
                )}
                <p className="text-2xl font-bold text-green-600">${Number(item.price).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
        {(!items || items.length === 0) && (
          <p className="text-center text-gray-500 mt-8">No items available in this category.</p>
        )}
      </main>
    </div>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ restaurant: string; category: string }>
}) {
  const { restaurant: restSlug, category: catSlug } = await params
  const restaurant = await getRestaurantBySlug(restSlug)
  const category = restaurant ? await getCategoryBySlug(restaurant.id, catSlug) as MenuCategory | null : null

  return {
    title: category && restaurant ? `${category.name} - ${restaurant.name} Menu` : 'Menu',
  }
}
