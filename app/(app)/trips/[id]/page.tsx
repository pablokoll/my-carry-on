'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { clearTokens } from '@/lib/api'
import {
  useTripDetail, useTripBags, useTripDestinations, useAllBags, useCategories,
  useUpdateTrip, useDeleteTrip, useToggleTripActive,
  useAddDestination, useUpdateDestination, useDeleteDestination,
  useAssignBag, useUnassignBag,
  type Destination, type BagWithItems,
} from '@/lib/queries'
import { useQueryClient } from '@tanstack/react-query'
import { keys } from '@/lib/queries'
import { FormModal, Field } from '@/components/ui/form-modal'
import { CreateBagModal, type Bag } from '@/components/create-bag-modal'
import { BagItemsTable, type Item, type Category } from '@/components/bag-items-table'
import { ConfirmModal } from '@/components/ui/confirm-modal'
import { TypeBadge } from '@/components/ui/type-badge'
import { btnPrimary, sectionHeader, rowStyle } from '@/lib/styles'
import { useTripEditForm } from './use-trip-edit'
import { useDestinationForm } from './use-destination-form'
import { useBagAssignment } from './use-bag-assignment'

export default function TripPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()

  const { data: trip, isLoading, isError } = useTripDetail(id)
  const { data: destinations = [], isLoading: destLoading } = useTripDestinations(id)
  const { data: tripBags = [] } = useTripBags(id)
  const { data: allBags = [] } = useAllBags()
  const { data: categories = [] } = useCategories()

  const updateTrip = useUpdateTrip(id)
  const deleteTrip = useDeleteTrip(id)
  const toggleActive = useToggleTripActive(id)
  const addDest = useAddDestination(id)
  const updateDest = useUpdateDestination(id)
  const deleteDest = useDeleteDestination(id)
  const assignBag = useAssignBag(id)
  const unassignBag = useUnassignBag(id)

  const assignedBags = tripBags.map((tb: BagWithItems) => ({ id: tb.id, name: tb.name, type: tb.type }))
  const bagItemsMap: Record<number, Item[]> = {}
  tripBags.forEach((tb: BagWithItems) => { bagItemsMap[tb.id] = tb.items ?? [] })
  const unassignedBags = allBags.filter((b: Bag) => !assignedBags.find((a: { id: number }) => a.id === b.id))

  const editForm = useTripEditForm(trip, updateTrip)
  const destForm = useDestinationForm(addDest, updateDest)
  const bagForm = useBagAssignment(unassignedBags, assignBag)

  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmTrip, setConfirmTrip] = useState(false)
  const [confirmDestId, setConfirmDestId] = useState<number | null>(null)
  const [confirmBagId, setConfirmBagId] = useState<number | null>(null)
  const [expandedBags, setExpandedBags] = useState<Set<number>>(new Set())
  const [createBagOpen, setCreateBagOpen] = useState(false)

  useEffect(() => {
    if (isError) { clearTokens(); router.replace('/login') }
  }, [isError, router])

  if (isLoading) return <p style={{ color: 'var(--fg-muted)', fontSize: '14px', textAlign: 'center', paddingTop: '48px' }}>Loading…</p>
  if (!trip) return <p style={{ color: 'var(--destructive)', textAlign: 'center', paddingTop: '48px' }}>Trip not found.</p>

  return (
    <>
      {/* Trip header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>{trip.name}</h2>
            {trip.is_active && (
              <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '99px', background: 'rgba(74,123,181,0.1)', color: 'var(--primary)' }}>Active</span>
            )}
          </div>
          {(trip.start_date || trip.end_date) && (
            <p style={{ fontSize: '12px', color: 'var(--fg-muted)', margin: 0 }}>
              {trip.start_date ?? '—'} → {trip.end_date ?? '—'}
            </p>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', padding: '5px 10px', fontSize: '18px', color: 'var(--fg-secondary)', cursor: 'pointer', lineHeight: 1 }}
          >⋯</button>
          {menuOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setMenuOpen(false)} />
              <div style={{ position: 'absolute', right: 0, top: '36px', zIndex: 20, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', boxShadow: 'var(--shadow-md)', minWidth: '140px', overflow: 'hidden' }}>
                <button onClick={() => { toggleActive.mutate(trip.is_active); setMenuOpen(false) }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}>
                  {trip.is_active ? 'Deactivate' : 'Active'}
                </button>
                <button onClick={() => { editForm.openEdit(); setMenuOpen(false) }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground)', borderTop: '1px solid var(--border)' }}>
                  Edit
                </button>
                <button onClick={() => { setMenuOpen(false); setConfirmTrip(true) }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--destructive)', borderTop: '1px solid var(--border)' }}>
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Destinations */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 style={sectionHeader}>Destinations</h3>
          <button style={{ ...btnPrimary, fontSize: '13px', padding: '5px 12px', height: 'auto' }} onClick={destForm.openAdd}>+ Add</button>
        </div>
        {destLoading ? (
          <p style={{ color: 'var(--fg-muted)', fontSize: '14px' }}>Loading…</p>
        ) : destinations.length === 0 ? (
          <p style={{ color: 'var(--fg-muted)', fontSize: '14px' }}>No destinations yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {destinations.map((dest: Destination) => (
              <div key={dest.id} style={rowStyle}>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--foreground)' }}>{dest.city}, {dest.country}</span>
                  {(dest.arrival_date || dest.departure_date) && (
                    <p style={{ fontSize: '12px', color: 'var(--fg-muted)', margin: '2px 0 0' }}>
                      {dest.arrival_date ?? '—'} → {dest.departure_date ?? '—'}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                  <button onClick={() => destForm.openEdit(dest)} title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', fontSize: '13px', padding: '4px 8px' }}>✎</button>
                  <button onClick={() => setConfirmDestId(dest.id)} title="Remove" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', fontSize: '16px', lineHeight: 1, padding: '4px 6px' }}>×</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bags */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', marginTop: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 style={sectionHeader}>Bags</h3>
          <div style={{ display: 'flex', gap: '6px' }}>
            {unassignedBags.length > 0 && (
              <button style={{ ...btnPrimary, background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', fontSize: '13px', padding: '5px 12px', height: 'auto' }} onClick={bagForm.openModal}>
                Assign
              </button>
            )}
            <button style={{ ...btnPrimary, fontSize: '13px', padding: '5px 12px', height: 'auto' }} onClick={() => setCreateBagOpen(true)}>+ New bag</button>
          </div>
        </div>
        {assignedBags.length === 0 ? (
          <p style={{ color: 'var(--fg-muted)', fontSize: '14px' }}>
            Bags assigned to this trip appear here.
            {allBags.length === 0 && ' Create bags first from the Bags page.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {assignedBags.map((bag: { id: number; name: string; type: string }) => {
              const expanded = expandedBags.has(bag.id)
              const items = bagItemsMap[bag.id] ?? []
              return (
                <div key={bag.id} style={{ background: 'var(--bg-surface)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
                    <button
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, flex: 1, textAlign: 'left' }}
                      onClick={() => setExpandedBags(prev => {
                        const next = new Set(prev)
                        next.has(bag.id) ? next.delete(bag.id) : next.add(bag.id)
                        return next
                      })}
                    >
                      <span style={{ fontSize: '13px', color: 'var(--fg-muted)', lineHeight: 1, transition: 'transform 120ms', display: 'inline-block', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>{bag.name}</span>
                      <TypeBadge type={bag.type} />
                      {(() => {
                        let total = 0, packed = 0
                        for (const i of items) {
                          if (i.sub_items?.length) {
                            for (const s of i.sub_items) { total += s.quantity || 1; if (s.packed) packed += s.quantity || 1 }
                          } else {
                            total += i.quantity || 1; if (i.packed) packed += i.quantity || 1
                          }
                        }
                        return <span style={{ fontSize: '12px', color: 'var(--fg-muted)' }}>{packed}/{total} packed</span>
                      })()}
                    </button>
                    <button
                      onClick={() => setConfirmBagId(bag.id)}
                      title="Remove bag"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', fontSize: '16px', lineHeight: 1, padding: '4px 6px', flexShrink: 0 }}
                    >×</button>
                  </div>
                  {expanded && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px' }}>
                      <BagItemsTable
                        bagId={bag.id}
                        initialItems={items}
                        categories={categories as Category[]}
                        onItemsChange={updated => {
                          qc.setQueryData(keys.tripBags(id), (old: BagWithItems[] | undefined) =>
                            old?.map((tb: BagWithItems) => tb.id === bag.id ? { ...tb, items: updated } : tb)
                          )
                        }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Edit trip modal */}
      <FormModal
        open={editForm.open}
        onClose={() => editForm.setOpen(false)}
        title="Edit trip"
        onSubmit={editForm.handleSubmit}
        submitting={editForm.isPending}
        submitLabel="Save"
        error={editForm.err}
      >
        <Field label="Name" error={editForm.nameErr}>
          <input type="text" autoFocus value={editForm.name} onChange={e => editForm.setName(e.target.value)} />
        </Field>
        <Field label="Start date">
          <input type="date" value={editForm.start} onChange={e => editForm.setStart(e.target.value)} />
        </Field>
        <Field label="End date">
          <input type="date" value={editForm.end} onChange={e => editForm.setEnd(e.target.value)} />
        </Field>
      </FormModal>

      {/* Add/edit destination modal */}
      <FormModal
        open={destForm.open}
        onClose={destForm.close}
        title={destForm.editing ? 'Edit destination' : 'Add destination'}
        onSubmit={destForm.handleSubmit}
        submitting={destForm.isPending}
        submitLabel={destForm.editing ? 'Save' : 'Add'}
        error={destForm.err}
      >
        <Field label="City" error={destForm.cityErr}>
          <input type="text" placeholder="e.g. Paris" autoFocus value={destForm.city} onChange={e => destForm.setCity(e.target.value)} />
        </Field>
        <Field label="Country" error={destForm.countryErr}>
          <input type="text" placeholder="e.g. France" value={destForm.country} onChange={e => destForm.setCountry(e.target.value)} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
          <Field label="Arrival">
            <input type="date" value={destForm.arrival} onChange={e => destForm.setArrival(e.target.value)} />
          </Field>
          <Field label="Departure">
            <input type="date" value={destForm.departure} onChange={e => destForm.setDeparture(e.target.value)} />
          </Field>
        </div>
      </FormModal>

      <CreateBagModal
        open={createBagOpen}
        onClose={() => setCreateBagOpen(false)}
        onCreated={async (bag) => { await bagForm.handleBagCreated(bag); setCreateBagOpen(false) }}
      />

      {/* Assign bag modal */}
      <FormModal
        open={bagForm.open}
        onClose={() => bagForm.setOpen(false)}
        title="Assign bag"
        onSubmit={bagForm.handleAssign}
        submitting={bagForm.isPending}
        submitLabel="Assign"
        error={bagForm.err}
      >
        <Field label="Bag">
          <select value={bagForm.selectedId} onChange={e => bagForm.setSelectedId(e.target.value)} style={{ cursor: 'pointer' }}>
            {unassignedBags.map((b: Bag) => (
              <option key={b.id} value={String(b.id)}>{b.name} ({b.type})</option>
            ))}
          </select>
        </Field>
      </FormModal>

      <ConfirmModal
        open={confirmTrip}
        title="Delete trip?"
        description="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={async () => { await deleteTrip.mutateAsync(); router.replace('/') }}
        onCancel={() => setConfirmTrip(false)}
      />
      <ConfirmModal
        open={confirmDestId !== null}
        title="Remove destination?"
        confirmLabel="Remove"
        onConfirm={() => { if (confirmDestId !== null) deleteDest.mutate(confirmDestId); setConfirmDestId(null) }}
        onCancel={() => setConfirmDestId(null)}
      />
      <ConfirmModal
        open={confirmBagId !== null}
        title="Remove bag from trip?"
        confirmLabel="Remove"
        onConfirm={() => { if (confirmBagId !== null) unassignBag.mutate(confirmBagId); setConfirmBagId(null) }}
        onCancel={() => setConfirmBagId(null)}
      />
    </>
  )
}
