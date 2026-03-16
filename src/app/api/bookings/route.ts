import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: staff } = await supabase.from('staff').select('organization_id').eq('user_id', user.id).single()
  if (!staff) return NextResponse.json({ error: 'No staff' }, { status: 403 })

  const { data } = await supabase.from('bookings')
    .select('*, services(name, duration_minutes), contacts(name, phone, email), staff!bookings_staff_id_fkey(name)')
    .eq('organization_id', staff.organization_id)
    .order('start_at', { ascending: true })

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  // Check for auth - if no user, this is a public booking
  const { data: { user } } = await supabase.auth.getUser()

  let orgId = body.organization_id
  if (user) {
    const { data: staff } = await supabase.from('staff').select('organization_id').eq('user_id', user.id).single()
    if (staff) orgId = staff.organization_id
  }

  if (!orgId) return NextResponse.json({ error: 'Missing org' }, { status: 400 })

  // Create or find contact
  let contactId = body.contact_id
  if (!contactId && body.contact_name) {
    const { data: contact } = await supabase.from('contacts').insert({
      organization_id: orgId, name: body.contact_name, email: body.contact_email, phone: body.contact_phone,
    }).select().single()
    contactId = contact?.id
  }

  const { data, error } = await supabase.from('bookings').insert({
    organization_id: orgId,
    contact_id: contactId,
    service_id: body.service_id,
    staff_id: body.staff_id,
    start_at: body.start_at,
    end_at: body.end_at,
    status: body.status || 'confirmed',
    notes: body.notes,
  }).select('*, services(name), contacts(name)').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
