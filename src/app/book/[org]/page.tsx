'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

type Service = { id: string; name: string; duration_minutes: number; price: number | null }
type Slot = { staff_id: string; staff_name: string; start: string; end: string }

export default function PublicBookingPage() {
  const { org } = useParams<{ org: string }>()
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState('')
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [submitted, setSubmitted] = useState(false)
  const [orgName, setOrgName] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.from('services').select('*').eq('organization_id', org).eq('is_active', true).then(({ data }) => setServices(data ?? []))
    supabase.from('organizations').select('name').eq('id', org).single().then(({ data }) => setOrgName(data?.name ?? ''))
  }, [org])

  useEffect(() => {
    if (!selectedService || !selectedDate) return
    fetch(`/api/slots?org_id=${org}&service_id=${selectedService}&date=${selectedDate}`)
      .then(r => r.json()).then(setSlots)
  }, [org, selectedService, selectedDate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSlot) return

    await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_id: org,
        service_id: selectedService,
        staff_id: selectedSlot.staff_id,
        start_at: selectedSlot.start,
        end_at: selectedSlot.end,
        contact_name: form.name,
        contact_email: form.email,
        contact_phone: form.phone,
      }),
    })
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-green-600">予約が完了しました</p>
            <p className="mt-2 text-gray-500">ご予約ありがとうございます。</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4" data-karma-context="public-booking" data-karma-auth="none">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{orgName || '予約'}</CardTitle>
            <p className="text-sm text-gray-500">ご希望のサービスと日時を選択してください</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Service Selection */}
            <div className="space-y-2">
              <Label>サービスを選択</Label>
              <div className="grid gap-2">
                {services.map(s => (
                  <button key={s.id} onClick={() => setSelectedService(s.id)}
                    className={`rounded-lg border p-3 text-left transition-colors ${selectedService === s.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                    data-karma-entity="service-option"
                  >
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.duration_minutes}分 {s.price ? `・¥${Number(s.price).toLocaleString()}` : ''}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Selection */}
            {selectedService && (
              <div className="space-y-2">
                <Label>日付を選択</Label>
                <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} min={new Date().toISOString().split('T')[0]} data-karma-test-id="date-input" />
              </div>
            )}

            {/* Slot Selection */}
            {slots.length > 0 && (
              <div className="space-y-2">
                <Label>時間を選択</Label>
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot, i) => (
                    <button key={i} onClick={() => setSelectedSlot(slot)}
                      className={`rounded border p-2 text-sm transition-colors ${selectedSlot === slot ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                    >
                      {new Date(slot.start).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                      <span className="block text-xs text-gray-500">{slot.staff_name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedDate && slots.length === 0 && selectedService && (
              <p className="text-sm text-gray-500">この日は空きがありません</p>
            )}

            {/* Contact Form */}
            {selectedSlot && (
              <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
                <div className="space-y-2"><Label>お名前 *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required data-karma-test-id="booking-name-input" /></div>
                <div className="space-y-2"><Label>メール</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                <div className="space-y-2"><Label>電話</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                <Button type="submit" className="w-full" data-karma-action="submit-booking" data-karma-test-id="submit-booking-btn">予約する</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
