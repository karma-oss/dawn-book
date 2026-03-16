import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('org_id')
  const serviceId = searchParams.get('service_id')
  const date = searchParams.get('date')

  if (!orgId || !serviceId || !date) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const supabase = await createClient()

  // Get service duration
  const { data: service } = await supabase.from('services').select('duration_minutes').eq('id', serviceId).single()
  if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 })

  const dayOfWeek = new Date(date).getDay()

  // Get staff schedules for this day
  const { data: schedules } = await supabase
    .from('staff_schedules')
    .select('*, staff!inner(id, name, organization_id)')
    .eq('day_of_week', dayOfWeek)
    .eq('staff.organization_id', orgId)

  // Get existing bookings for this day
  const { data: bookings } = await supabase
    .from('bookings')
    .select('staff_id, start_at, end_at')
    .eq('organization_id', orgId)
    .gte('start_at', `${date}T00:00:00`)
    .lte('start_at', `${date}T23:59:59`)
    .neq('status', 'cancelled')

  // Get blocked times
  const { data: blocked } = await supabase
    .from('blocked_times')
    .select('staff_id, start_at, end_at')
    .gte('start_at', `${date}T00:00:00`)
    .lte('end_at', `${date}T23:59:59`)

  // Generate available slots
  const slots: { staff_id: string; staff_name: string; start: string; end: string }[] = []
  const duration = service.duration_minutes

  schedules?.forEach((schedule) => {
    const staffId = (schedule.staff as unknown as { id: string }).id
    const staffName = (schedule.staff as unknown as { name: string }).name

    const [startH, startM] = schedule.start_time.split(':').map(Number)
    const [endH, endM] = schedule.end_time.split(':').map(Number)

    let current = startH * 60 + startM
    const end = endH * 60 + endM

    while (current + duration <= end) {
      const slotStart = new Date(`${date}T${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}:00`)
      const slotEnd = new Date(slotStart.getTime() + duration * 60000)

      // Check conflicts
      const hasConflict = bookings?.some(b =>
        b.staff_id === staffId &&
        new Date(b.start_at) < slotEnd &&
        new Date(b.end_at) > slotStart
      )

      const isBlocked = blocked?.some(b =>
        b.staff_id === staffId &&
        new Date(b.start_at) < slotEnd &&
        new Date(b.end_at) > slotStart
      )

      if (!hasConflict && !isBlocked) {
        slots.push({
          staff_id: staffId,
          staff_name: staffName,
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
        })
      }

      current += 30 // 30min intervals
    }
  })

  return NextResponse.json(slots)
}
