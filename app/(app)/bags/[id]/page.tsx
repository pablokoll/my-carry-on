'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api, clearTokens } from '@/lib/api'
import { BagItemsTable, type Item, type Category } from '@/components/bag-items-table'
import { FormModal, Field } from '@/components/ui/form-modal'

interface Bag {
  id: number
  name: string
  type: string
}

const BAG_TYPES = ['Backpack', 'Carry-on', 'Checked', 'Personal item', 'Duffel', 'Tote', 'Other']

export default function BagDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [bag, setBag] = useState<Bag | null>(null)
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState('')
  const [editNameErr, setEditNameErr] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editErr, setEditErr] = useState('')

  useEffect(() => {
    api.get<Bag & { items: Item[] }>(`/bags/${id}`)
      .then(data => {
        setBag({ id: data.id, name: data.name, type: data.type })
        setItems(data.items)
      })
      .catch((e: Error & { status?: number }) => {
        if (e.status === 401) { clearTokens(); router.replace('/login') }
      })
      .finally(() => setLoading(false))

    api.get<Category[]>('/categories').then(setCategories)
  }, [id, router])

  function openEdit() {
    if (!bag) return
    setEditName(bag.name)
    setEditType(bag.type)
    setEditNameErr(''); setEditErr('')
    setEditOpen(true)
  }

  async function handleEditBag() {
    if (!editName.trim()) { setEditNameErr('Name is required'); return }
    setEditNameErr(''); setEditErr(''); setEditSubmitting(true)
    try {
      const updated = await api.put<Bag>(`/bags/${id}`, { name: editName.trim(), type: editType })
      setBag(updated)
      setEditOpen(false)
    } catch (e) {
      setEditErr(e instanceof Error ? e.message : 'Failed to update bag')
    } finally {
      setEditSubmitting(false)
    }
  }

  if (loading) return <p style={{ color: 'var(--fg-muted)', fontSize: '14px', textAlign: 'center', paddingTop: '48px' }}>Loading…</p>
  if (!bag) return <p style={{ color: 'var(--destructive)', textAlign: 'center', paddingTop: '48px' }}>Bag not found.</p>

  return (
    <>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 4px' }}>{bag.name}</h2>
          <span style={{ background: 'rgba(74,123,181,0.1)', color: 'var(--primary)', borderRadius: '999px', padding: '2px 10px', fontSize: '12px', fontWeight: 500 }}>{bag.type}</span>
        </div>
        <button
          onClick={openEdit}
          style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', color: 'var(--fg-secondary)', cursor: 'pointer' }}
        >
          Edit bag
        </button>
      </div>

      <BagItemsTable
        bagId={bag.id}
        initialItems={items}
        categories={categories}
        onItemsChange={setItems}
      />

      <FormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit bag"
        onSubmit={handleEditBag}
        submitting={editSubmitting}
        submitLabel="Save"
        error={editErr}
      >
        <Field label="Name" error={editNameErr}>
          <input type="text" autoFocus value={editName} onChange={e => setEditName(e.target.value)} />
        </Field>
        <Field label="Type">
          <select value={editType} onChange={e => setEditType(e.target.value)} style={{ cursor: 'pointer' }}>
            {BAG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
      </FormModal>
    </>
  )
}
