import { getStaffWithOrg } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const dayNames = ['日', '月', '火', '水', '木', '金', '土']

export default async function SchedulesPage() {
  const staff = await getStaffWithOrg()
  const supabase = await createClient()

  const { data: allStaff } = await supabase.from('staff').select('id, name').eq('organization_id', staff.organization_id)
  const { data: schedules } = await supabase.from('staff_schedules').select('*')
    .in('staff_id', allStaff?.map(s => s.id) ?? [])

  return (
    <div data-karma-context="schedule-management" data-karma-auth="required">
      <h1 className="mb-6 text-2xl font-bold">スケジュール</h1>

      <div className="grid gap-4 md:grid-cols-2">
        {allStaff?.map(s => {
          const staffSchedules = schedules?.filter(sc => sc.staff_id === s.id) ?? []
          return (
            <Card key={s.id} data-karma-entity="staff-schedule">
              <CardHeader><CardTitle className="text-base">{s.name}</CardTitle></CardHeader>
              <CardContent>
                {staffSchedules.length === 0 ? <p className="text-sm text-gray-500">スケジュール未設定</p> : (
                  <div className="space-y-1">
                    {staffSchedules.sort((a, b) => a.day_of_week - b.day_of_week).map(sc => (
                      <div key={sc.id} className="flex items-center justify-between text-sm">
                        <span className="font-medium">{dayNames[sc.day_of_week]}曜日</span>
                        <span className="text-gray-600">{sc.start_time.slice(0, 5)} - {sc.end_time.slice(0, 5)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
