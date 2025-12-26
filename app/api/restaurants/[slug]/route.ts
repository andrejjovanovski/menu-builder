import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}