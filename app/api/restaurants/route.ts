import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { CreateRestaurantInput } from '@/src/types'

export async function GET(request: NextRequest) {
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

  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
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

  try {
    const body = await request.json()
    const { name, slug } = body as CreateRestaurantInput
    if (!name?.trim() || !slug?.trim()) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    // Optional fields for onboarding / full registration
    const optional: Record<string, unknown> = {}
    const optionalKeys = [
      'subtitle', 'description', 'est_year', 'slogan', 'open_hours', 'footer_quote',
      'phone', 'facebook_url', 'instagram_url', 'tiktok_url', 'appearance',
      'background_color', 'accent_color', 'card_bg_color', 'text_color', 'muted_text_color',
      'open_bottom_sheet_on_click',
    ] as const
    for (const key of optionalKeys) {
      if (body[key] !== undefined && body[key] !== null && body[key] !== '') {
        optional[key] = body[key]
      }
    }

    const { data, error } = await supabase
      .from('restaurants')
      .insert({ name: name.trim(), slug: slug.trim(), owner_id: user.id, ...optional })
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