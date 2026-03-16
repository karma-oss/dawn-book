'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type Booking = {
  id: string; start_at: string; end_at: string; status: string; notes: string | null
  services?: { name: string }; contacts?: { name: string; phone: string; email: string }
  staff?: { name: string }
}

const statusColors: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700', completed: 'bg-gray-100 text-gray-700',
}
const statusLabels: Record<string, string> = { confirmed: '確定', pending: '保留', cancelled: 'キャンセル', completed: '完了' }

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filter, setFilter] = useState('all')

  useEffect(() => { fetch('/api/bookings').then(r => r.json()).then(setBookings) }, [])

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/bookings/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    setBookings(await (await fetch('/api/bookings')).json())
  }

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter)

  return (
    <div data-karma-context="booking-management" data-karma-auth="required">
      <h1 className="mb-6 text-2xl font-bold">予約一覧</h1>
      <div className="mb-4 flex gap-2">
        {['all', 'confirmed', 'pending', 'completed', 'cancelled'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-3 py-1 text-sm ${filter === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s === 'all' ? '全て' : statusLabels[s]}
          </button>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">予約</CardTitle></CardHeader>
        <CardContent>
          {filtered.length === 0 ? <p className="text-sm text-gray-500">予約なし</p> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>日時</TableHead><TableHead>顧客</TableHead><TableHead>サービス</TableHead><TableHead>ステータス</TableHead><TableHead>操作</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map(b => (
                  <TableRow key={b.id} data-karma-entity="booking">
                    <TableCell>{new Date(b.start_at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</TableCell>
                    <TableCell>{b.contacts?.name ?? '-'}</TableCell>
                    <TableCell>{b.services?.name ?? '-'}</TableCell>
                    <TableCell><span className={`rounded px-2 py-0.5 text-xs font-medium ${statusColors[b.status]}`}>{statusLabels[b.status]}</span></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {b.status === 'confirmed' && <Button variant="outline" size="sm" onClick={() => updateStatus(b.id, 'completed')}>完了</Button>}
                        {b.status !== 'cancelled' && b.status !== 'completed' && <Button variant="outline" size="sm" className="text-red-600" onClick={() => updateStatus(b.id, 'cancelled')}>キャンセル</Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
