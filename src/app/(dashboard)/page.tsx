import { getStaffWithOrg } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DashboardPage() {
  const staff = await getStaffWithOrg()
  const supabase = await createClient()
  const orgId = staff.organization_id
  const today = new Date().toISOString().split('T')[0]

  const [todayBookings, upcomingBookings, totalBookings] = await Promise.all([
    supabase.from('bookings').select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId).gte('start_at', `${today}T00:00:00`).lte('start_at', `${today}T23:59:59`).neq('status', 'cancelled'),
    supabase.from('bookings').select('*, services(name), contacts(name)')
      .eq('organization_id', orgId).gte('start_at', `${today}T00:00:00`).lte('start_at', `${today}T23:59:59`)
      .neq('status', 'cancelled').order('start_at').limit(10),
    supabase.from('bookings').select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId).eq('status', 'confirmed'),
  ])

  return (
    <div data-karma-context="dashboard" data-karma-auth="required">
      <h1 className="mb-6 text-2xl font-bold">ダッシュボード</h1>
      <p className="mb-4 text-sm text-gray-500">{staff.organizations?.name}</p>
      <p className="mb-4 text-sm text-gray-500">公開予約URL: {process.env.NEXT_PUBLIC_APP_URL}/book/{orgId}</p>

      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <Card className="bg-blue-50"><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">今日の予約</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-blue-600">{todayBookings.count ?? 0}</p></CardContent></Card>
        <Card className="bg-green-50"><CardHeader className="pb-2"><CardTitle className="text-sm text-gray-600">確定済み予約</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-green-600">{totalBookings.count ?? 0}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">今日の予約</CardTitle></CardHeader>
        <CardContent>
          {!upcomingBookings.data?.length ? <p className="text-sm text-gray-500">今日の予約はありません</p> : (
            <div className="space-y-3">
              {upcomingBookings.data.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-lg border p-3" data-karma-entity="booking">
                  <div>
                    <p className="font-medium">{b.contacts?.name ?? '名前なし'}</p>
                    <p className="text-xs text-gray-500">{b.services?.name} ・ {new Date(b.start_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <Badge status={b.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Badge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    confirmed: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-700', completed: 'bg-gray-100 text-gray-700',
  }
  const labels: Record<string, string> = { confirmed: '確定', pending: '保留', cancelled: 'キャンセル', completed: '完了' }
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${colors[status] ?? ''}`}>{labels[status] ?? status}</span>
}
