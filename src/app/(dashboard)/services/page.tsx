'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type Service = { id: string; name: string; duration_minutes: number; price: number | null; is_active: boolean }

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [form, setForm] = useState({ name: '', duration_minutes: '30', price: '', is_active: true })

  useEffect(() => { fetch('/api/services').then(r => r.json()).then(setServices) }, [])

  function openCreate() { setEditing(null); setForm({ name: '', duration_minutes: '30', price: '', is_active: true }); setDialogOpen(true) }
  function openEdit(s: Service) { setEditing(s); setForm({ name: s.name, duration_minutes: String(s.duration_minutes), price: s.price?.toString() ?? '', is_active: s.is_active }); setDialogOpen(true) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = { ...form, duration_minutes: Number(form.duration_minutes), price: form.price ? Number(form.price) : null }
    if (editing) {
      await fetch(`/api/services/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    } else {
      await fetch('/api/services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    }
    setDialogOpen(false)
    setServices(await (await fetch('/api/services')).json())
  }

  async function handleDelete(id: string) {
    if (!confirm('削除しますか？')) return
    await fetch(`/api/services/${id}`, { method: 'DELETE' })
    setServices(await (await fetch('/api/services')).json())
  }

  return (
    <div data-karma-context="service-management" data-karma-auth="required">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">サービス</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button data-karma-test-id="create-service-btn" />} onClick={openCreate}>新規作成</DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? '編集' : '新規サービス'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>名前 *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="space-y-2"><Label>所要時間（分） *</Label><Input type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })} required /></div>
              <div className="space-y-2"><Label>料金</Label><Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                <Label htmlFor="is_active">有効</Label>
              </div>
              <Button type="submit" className="w-full">{editing ? '更新' : '作成'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">サービス一覧</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>名前</TableHead><TableHead>時間</TableHead><TableHead>料金</TableHead><TableHead>状態</TableHead><TableHead>操作</TableHead></TableRow></TableHeader>
            <TableBody>
              {services.map(s => (
                <TableRow key={s.id} data-karma-entity="service">
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.duration_minutes}分</TableCell>
                  <TableCell>{s.price ? `¥${Number(s.price).toLocaleString()}` : '-'}</TableCell>
                  <TableCell><span className={`rounded px-2 py-0.5 text-xs ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{s.is_active ? '有効' : '無効'}</span></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(s)}>編集</Button>
                      <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(s.id)}>削除</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
