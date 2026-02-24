import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { CreatePaymentInput } from '@/src/types'

async function requireAdmin(request: NextRequest) {

export async function GET(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {},
      },
    }
  )
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), supabase: null }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), supabase: null }

  return { error: null, supabase }
}

export async function GET(request: NextRequest) {
  const { error, supabase } = await requireAdmin(request)
  if (error) return error
  if (!supabase) return NextResponse.json({ error: 'Server error' }, { status: 500 })

  const { data, error: fetchError } = await supabase

  if (!supabase) return NextResponse.json({ error: 'Server error' }, { status: 500 })

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false })

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(request: NextRequest) {
  const { error, supabase } = await requireAdmin(request)
  if (error) return error
  if (!supabase) return NextResponse.json({ error: 'Server error' }, { status: 500 })

  try {
    const body: CreatePaymentInput = await request.json()
    const { restaurant_id, expiration_date, notes, status } = body
    if (!restaurant_id || !expiration_date) {
      return NextResponse.json({ error: 'restaurant_id and expiration_date are required' }, { status: 400 })
    }

    const { data, error: insertError } = await supabase
      .from('payments')
      .insert({
        restaurant_id,
        expiration_date,
        notes: notes ?? null,
        status: status ?? 'active',
      })
      .select()
      .single()

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
