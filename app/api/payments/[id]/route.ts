import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { UpdatePaymentInput } from '@/src/types'

async function requireAdmin(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAdmin(request)
  if (error) return error
  if (!supabase) return NextResponse.json({ error: 'Server error' }, { status: 500 })

  const { id } = await params
  try {
    const body: UpdatePaymentInput = await request.json()
    const updates: Record<string, unknown> = {}
    if (body.expiration_date !== undefined) updates.expiration_date = body.expiration_date
    if (body.notes !== undefined) updates.notes = body.notes
    if (body.status !== undefined) updates.status = body.status
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data, error: updateError } = await supabase
      .from('payments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
