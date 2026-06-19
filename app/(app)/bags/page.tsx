'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAllBags, useDeleteBag, useDuplicateBag } from '@/lib/queries'
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
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmId, setConfirmId] = useState<number | null>(null)

  const { data: bags = [], isLoading } = useAllBags()
  const deleteBag = useDeleteBag()
  const duplicateBag = useDuplicateBag()

  if (isLoading) {
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
          {bags.map((bag: Bag) => (
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
                  disabled={duplicateBag.isPending && duplicateBag.variables === bag.id}
                  onClick={() => duplicateBag.mutate(bag.id)}
                >
                  {duplicateBag.isPending && duplicateBag.variables === bag.id ? '…' : 'Duplicate'}
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
        onCreated={() => setModalOpen(false)}
      />

      <ConfirmModal
        open={confirmId !== null}
        title="Delete bag?"
        description="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => { if (confirmId !== null) deleteBag.mutate(confirmId); setConfirmId(null) }}
        onCancel={() => setConfirmId(null)}
      />
    </>
  )
}
