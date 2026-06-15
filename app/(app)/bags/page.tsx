'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { CreateBagModal, type Bag } from '@/components/create-bag-modal'
import { ConfirmModal } from '@/components/ui/confirm-modal'

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
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [duplicating, setDuplicating] = useState<number | null>(null)

  useEffect(() => {
    api.get<Bag[]>('/bags')
      .then(setBags)
      .finally(() => setLoading(false))
  }, [])

  async function handleDuplicate(id: number) {
    setDuplicating(id)
    try {
      const newBag = await api.post<Bag>(`/bags/${id}/duplicate`, {})
      setBags(prev => [...prev, newBag])
    } catch { /* silent */ } finally {
      setDuplicating(null)
    }
  }

  async function handleDelete() {
    if (confirmId === null) return
    try {
      await api.delete(`/bags/${confirmId}`)
      setBags(prev => prev.filter(b => b.id !== confirmId))
    } catch { /* silent */ } finally {
      setConfirmId(null)
    }
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
              <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                <button
                  style={{ ...btnDestructive, color: 'var(--fg-muted)' }}
                  disabled={duplicating === bag.id}
                  onClick={() => handleDuplicate(bag.id)}
                >
                  {duplicating === bag.id ? '…' : 'Duplicate'}
                </button>
                <button style={btnDestructive} onClick={() => setConfirmId(bag.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateBagModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={bag => setBags(prev => [bag, ...prev])}
      />

      <ConfirmModal
        open={confirmId !== null}
        title="Delete bag?"
        description="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </>
  )
}
