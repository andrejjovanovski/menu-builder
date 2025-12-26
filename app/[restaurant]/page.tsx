import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabaseServer } from '@/lib/supabase'
import { Restaurant, MenuCategory } from '@/src/types'

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

  const { data: categories } = await supabaseServer
    .from('menu_categories')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .order('order')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories?.map((category) => (
            <Link
              key={category.id}
              href={`/${restaurant.slug}/${category.slug}`}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{category.name}</h2>
              <p className="text-gray-600">View items</p>
            </Link>
          ))}
        </div>
        {(!categories || categories.length === 0) && (
          <p className="text-center text-gray-500 mt-8">No categories available.</p>
        )}
      </main>
    </div>
  )
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