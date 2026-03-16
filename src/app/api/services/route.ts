import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: staff } = await supabase.from('staff').select('organization_id').eq('user_id', user.id).single()
  if (!staff) return NextResponse.json({ error: 'No staff' }, { status: 403 })

  const { data } = await supabase.from('services').select('*').eq('organization_id', staff.organization_id).order('name')
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: staff } = await supabase.from('staff').select('organization_id').eq('user_id', user.id).single()
  if (!staff) return NextResponse.json({ error: 'No staff' }, { status: 403 })

  const body = await request.json()
  const { data, error } = await supabase.from('services').insert({
    organization_id: staff.organization_id,
    name: body.name,
    duration_minutes: body.duration_minutes,
    price: body.price || null,
    is_active: body.is_active ?? true,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
