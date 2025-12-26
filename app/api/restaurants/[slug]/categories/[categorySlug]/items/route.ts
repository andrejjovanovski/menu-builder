import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { CreateMenuItemInput } from '@/src/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; categorySlug: string }> }
) {
  const { slug, categorySlug } = await params
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() { },
      },
    }
  )

  // Get restaurant
  const { data: restaurant, error: restError } = await supabase
    .from('restaurants')
    .select('id')
    .eq('slug', slug)
    .single()

  if (restError || !restaurant) {
    return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
  }

  // Get category
  const { data: category, error: catError } = await supabase
    .from('menu_categories')
    .select('id')
    .eq('restaurant_id', restaurant.id)
    .eq('slug', categorySlug)
    .single()

  if (catError || !category) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('category_id', category.id)
    .order('order')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; categorySlug: string }> }
) {
  const { slug, categorySlug } = await params
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() { },
      },
    }
  )

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check ownership
  const { data: restaurant, error: restError } = await supabase
    .from('restaurants')
    .select('id')
    .eq('slug', slug)
    .eq('owner_id', user.id)
    .single()

  if (restError || !restaurant) {
    return NextResponse.json({ error: 'Restaurant not found or access denied' }, { status: 404 })
  }

  // Get category
  const { data: category, error: catError } = await supabase
    .from('menu_categories')
    .select('id')
    .eq('restaurant_id', restaurant.id)
    .eq('slug', categorySlug)
    .single()

  if (catError || !category) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  }

  try {
    const body: Omit<CreateMenuItemInput, 'restaurant_id' | 'category_id'> = await request.json()

    const { data, error } = await supabase
      .from('menu_items')
      .insert({ ...body, restaurant_id: restaurant.id, category_id: category.id })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}