'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { FormModal, Field } from '@/components/ui/form-modal'

interface Bag {
  id: number
  name: string
  type: 'carry-on' | 'checked' | 'backpack' | 'other'
}

const BAG_TYPES = ['carry-on', 'checked', 'backpack', 'other'] as const

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
  const [bags, setBags] = useState<Bag[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<typeof BAG_TYPES[number]>('carry-on')
  const [nameError, setNameError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    api.get<Bag[]>('/bags')
      .then(setBags)
      .finally(() => setLoading(false))
  }, [])

  function handleClose() {
    setModalOpen(false)
    setName('')
    setType('carry-on')
    setNameError('')
    setFormError('')
  }

  async function handleCreate() {
    if (!name.trim()) { setNameError('Name is required'); return }
    setNameError('')
    setFormError('')
    setSubmitting(true)
    try {
      const bag = await api.post<Bag>('/bags', { name: name.trim(), type })
      setBags(prev => [bag, ...prev])
      handleClose()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to create bag')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/bags/${id}`)
      setBags(prev => prev.filter(b => b.id !== id))
    } catch {
      // silent
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
          <p style={{ color: 'var(--fg-muted)', fontSize: '15px', marginBottom: '20px' }}>No bags yet. Create your first bag.</p>
          <button style={btnPrimary} onClick={() => setModalOpen(true)}>New bag</button>
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
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--foreground)' }}>{bag.name}</span>
                <TypeBadge type={bag.type} />
              </div>
              <button style={btnDestructive} onClick={() => handleDelete(bag.id)}>Delete</button>
            </div>
          ))}
        </div>
      )}

      <FormModal
        open={modalOpen}
        onClose={handleClose}
        title="New bag"
        onSubmit={handleCreate}
        submitting={submitting}
        submitLabel="Create bag"
        error={formError}
      >
        <Field label="Name" error={nameError}>
          <input
            type="text"
            placeholder="e.g. Main carry-on"
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
          />
        </Field>
        <Field label="Type">
          <select value={type} onChange={e => setType(e.target.value as typeof BAG_TYPES[number])} style={{ cursor: 'pointer' }}>
            {BAG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
      </FormModal>
    </>
  )
}
