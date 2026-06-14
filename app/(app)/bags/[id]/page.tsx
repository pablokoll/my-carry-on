'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api, clearTokens } from '@/lib/api'
import { BagItemsTable, type Item, type Category } from '@/components/bag-items-table'

interface Bag {
  id: number
  name: string
  type: string
}

export default function BagDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [bag, setBag] = useState<Bag | null>(null)
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])

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

  if (loading) return <p style={{ color: 'var(--fg-muted)', fontSize: '14px', textAlign: 'center', paddingTop: '48px' }}>Loading…</p>
  if (!bag) return <p style={{ color: 'var(--destructive)', textAlign: 'center', paddingTop: '48px' }}>Bag not found.</p>

  return (
    <>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>{bag.name}</h2>
            <span style={{ background: 'rgba(74,123,181,0.1)', color: 'var(--primary)', borderRadius: '999px', padding: '2px 10px', fontSize: '12px', fontWeight: 500 }}>{bag.type}</span>
          </div>
        </div>
      </div>

      <BagItemsTable
        bagId={bag.id}
        initialItems={items}
        categories={categories}
        onItemsChange={setItems}
      />
    </>
  )
}
