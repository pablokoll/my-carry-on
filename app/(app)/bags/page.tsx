'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { CreateBagModal, type Bag } from '@/components/create-bag-modal'

const btnPrimary: React.CSSProperties = {
  background: 'var(--primary)',
  color: 'var(--primary-foreground)',
  border: 'none',
  borderRadius: '8px',
  padding: '8px 16px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
}

const btnDestructive: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--destructive)',
  cursor: 'pointer',
  fontSize: '13px',
  padding: '4px 8px',
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span style={{
      background: 'rgba(74,123,181,0.1)',
      color: 'var(--primary)',
      borderRadius: '999px',
      padding: '2px 10px',
      fontSize: '12px',
      fontWeight: 500,
    }}>
      {type}
    </span>
  )
}

export default function BagsPage() {
  const router = useRouter()
  const [bags, setBags] = useState<Bag[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    api.get<Bag[]>('/bags')
      .then(setBags)
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id: number) {
    if (!confirm('Delete this bag? This cannot be undone.')) return
    try {
      await api.delete(`/bags/${id}`)
      setBags(prev => prev.filter(b => b.id !== id))
    } catch { /* silent */ }
  }

  if (loading) {
    return <p style={{ color: 'var(--fg-muted)', fontSize: '14px', textAlign: 'center', paddingTop: '48px' }}>Loading…</p>
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>Bags</h2>
        <button style={btnPrimary} onClick={() => setModalOpen(true)}>New bag</button>
      </div>

      {bags.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: '64px' }}>
          <p style={{ color: 'var(--fg-muted)', fontSize: '15px', marginBottom: '20px' }}>No bags yet.</p>
          <button style={btnPrimary} onClick={() => setModalOpen(true)}>Prepare your first bag</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {bags.map(bag => (
            <div key={bag.id} style={{
              background: 'var(--bg-surface)',
              borderRadius: '8px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
              onClick={() => router.push(`/bags/${bag.id}`)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--foreground)' }}>{bag.name}</span>
                <TypeBadge type={bag.type} />
              </div>
              <button style={btnDestructive} onClick={e => { e.stopPropagation(); handleDelete(bag.id) }}>Delete</button>
            </div>
          ))}
        </div>
      )}

      <CreateBagModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={bag => setBags(prev => [bag, ...prev])}
      />
    </>
  )
}
