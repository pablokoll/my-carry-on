'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { clearTokens } from '@/lib/api'
import { useBagDetail, useUpdateBag, useCategories } from '@/lib/queries'
import { BagItemsTable, type Category } from '@/components/bag-items-table'
import { FormModal, Field } from '@/components/ui/form-modal'

const BAG_TYPES = ['Backpack', 'Carry-on', 'Checked', 'Personal item', 'Duffel', 'Tote', 'Other']

export default function BagDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: bagData, isLoading, isError } = useBagDetail(id)
  const { data: categories = [] } = useCategories()
  const updateBag = useUpdateBag(id)

  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState('')
  const [editNameErr, setEditNameErr] = useState('')
  const [editErr, setEditErr] = useState('')

  useEffect(() => {
    if (isError) { clearTokens(); router.replace('/login') }
  }, [isError, router])

  function openEdit() {
    if (!bagData) return
    setEditName(bagData.name)
    setEditType(bagData.type)
    setEditNameErr(''); setEditErr('')
    setEditOpen(true)
  }

  async function handleEditBag() {
    if (!editName.trim()) { setEditNameErr('Name is required'); return }
    setEditNameErr(''); setEditErr('')
    try {
      await updateBag.mutateAsync({ name: editName.trim(), type: editType })
      setEditOpen(false)
    } catch (e) {
      setEditErr(e instanceof Error ? e.message : 'Failed to update bag')
    }
  }

  if (isLoading) return <p style={{ color: 'var(--fg-muted)', fontSize: '14px', textAlign: 'center', paddingTop: '48px' }}>Loading…</p>
  if (!bagData) return <p style={{ color: 'var(--destructive)', textAlign: 'center', paddingTop: '48px' }}>Bag not found.</p>

  return (
    <>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 4px' }}>{bagData.name}</h2>
          <span style={{ background: 'rgba(74,123,181,0.1)', color: 'var(--primary)', borderRadius: '999px', padding: '2px 10px', fontSize: '12px', fontWeight: 500 }}>{bagData.type}</span>
        </div>
        <button
          onClick={openEdit}
          style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', color: 'var(--fg-secondary)', cursor: 'pointer' }}
        >
          Edit bag
        </button>
      </div>

      <BagItemsTable
        bagId={bagData.id}
        initialItems={bagData.items ?? []}
        categories={categories as Category[]}
        showPacked={false}
      />

      <FormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit bag"
        onSubmit={handleEditBag}
        submitting={updateBag.isPending}
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
