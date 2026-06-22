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
import { btnPrimary, btnDestructive, sectionHeader, rowStyle } from '@/lib/styles'

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

  // edit trip form
  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editStart, setEditStart] = useState('')
  const [editEnd, setEditEnd] = useState('')
  const [editNameErr, setEditNameErr] = useState('')
  const [editErr, setEditErr] = useState('')

  // destination form
  const [destOpen, setDestOpen] = useState(false)
  const [destCity, setDestCity] = useState('')
  const [destCountry, setDestCountry] = useState('')
  const [destArrival, setDestArrival] = useState('')
  const [destDeparture, setDestDeparture] = useState('')
  const [destCityErr, setDestCityErr] = useState('')
  const [destCountryErr, setDestCountryErr] = useState('')
  const [destErr, setDestErr] = useState('')
  const [editingDest, setEditingDest] = useState<Destination | null>(null)

  // bag assignment
  const [bagOpen, setBagOpen] = useState(false)
  const [createBagOpen, setCreateBagOpen] = useState(false)
  const [selectedBagId, setSelectedBagId] = useState('')
  const [bagErr, setBagErr] = useState('')
  const [expandedBags, setExpandedBags] = useState<Set<number>>(new Set())

  // kebab + confirms
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmTrip, setConfirmTrip] = useState(false)
  const [confirmDestId, setConfirmDestId] = useState<number | null>(null)
  const [confirmBagId, setConfirmBagId] = useState<number | null>(null)

  useEffect(() => {
    if (isError) { clearTokens(); router.replace('/login') }
  }, [isError, router])

  // Invalidate tripBags when chat mutates a bag
  useEffect(() => {
    function onBagMutated(e: Event) {
      const bagId = (e as CustomEvent<{ bag_id: number | null }>).detail?.bag_id
      if (bagId != null) {
        qc.invalidateQueries({ queryKey: keys.bag(bagId) })
        qc.invalidateQueries({ queryKey: keys.tripBags(id) })
      } else {
        qc.invalidateQueries({ queryKey: keys.tripBags(id) })
        qc.invalidateQueries({ queryKey: keys.bags() })
      }
    }
    window.addEventListener('chat:bag-mutated', onBagMutated)
    return () => window.removeEventListener('chat:bag-mutated', onBagMutated)
  }, [id, qc])

  const assignedBags = tripBags.map((tb: BagWithItems) => ({ id: tb.id, name: tb.name, type: tb.type }))
  const bagItemsMap: Record<number, Item[]> = {}
  tripBags.forEach((tb: BagWithItems) => { bagItemsMap[tb.id] = tb.items ?? [] })

  const unassignedBags = allBags.filter((b: Bag) => !assignedBags.find((a: { id: number }) => a.id === b.id))

  // --- edit trip ---
  function openEdit() {
    if (!trip) return
    setEditName(trip.name)
    setEditStart(trip.start_date ?? '')
    setEditEnd(trip.end_date ?? '')
    setEditNameErr(''); setEditErr('')
    setEditOpen(true)
  }

  async function handleEditTrip() {
    if (!editName.trim()) { setEditNameErr('Name is required'); return }
    setEditNameErr(''); setEditErr('')
    try {
      await updateTrip.mutateAsync({ name: editName.trim(), start_date: editStart || null, end_date: editEnd || null })
      setEditOpen(false)
    } catch (e) {
      setEditErr(e instanceof Error ? e.message : 'Failed to update trip')
    }
  }

  // --- destinations ---
  function closeDestModal() {
    setDestOpen(false); setEditingDest(null)
    setDestCity(''); setDestCountry(''); setDestArrival(''); setDestDeparture('')
    setDestCityErr(''); setDestCountryErr(''); setDestErr('')
  }

  function openEditDest(dest: Destination) {
    setEditingDest(dest)
    setDestCity(dest.city); setDestCountry(dest.country)
    setDestArrival(dest.arrival_date ?? ''); setDestDeparture(dest.departure_date ?? '')
    setDestCityErr(''); setDestCountryErr(''); setDestErr('')
    setDestOpen(true)
  }

  async function handleAddDestination() {
    let valid = true
    if (!destCity.trim()) { setDestCityErr('City is required'); valid = false } else setDestCityErr('')
    if (!destCountry.trim()) { setDestCountryErr('Country is required'); valid = false } else setDestCountryErr('')
    if (!valid) return
    setDestErr('')
    const data = { city: destCity.trim(), country: destCountry.trim(), arrival_date: destArrival || null, departure_date: destDeparture || null }
    try {
      if (editingDest) {
        await updateDest.mutateAsync({ destId: editingDest.id, data })
      } else {
        await addDest.mutateAsync(data)
      }
      closeDestModal()
    } catch (e) {
      setDestErr(e instanceof Error ? e.message : 'Failed to save destination')
    }
  }

  // --- bags ---
  function openBagModal() {
    const first = unassignedBags[0]
    setSelectedBagId(first ? String(first.id) : '')
    setBagErr(''); setBagOpen(true)
  }

  async function handleAssignBag() {
    if (!selectedBagId) return
    setBagErr('')
    try {
      await assignBag.mutateAsync(Number(selectedBagId))
      setBagOpen(false)
    } catch (e) {
      setBagErr(e instanceof Error ? e.message : 'Failed to assign bag')
    }
  }

  async function handleBagCreated(bag: Bag) {
    try {
      await assignBag.mutateAsync(bag.id)
    } catch { /* silent */ }
    setCreateBagOpen(false)
  }

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
                <button onClick={() => { openEdit(); setMenuOpen(false) }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground)', borderTop: '1px solid var(--border)' }}>
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
          <button style={{ ...btnPrimary, fontSize: '13px', padding: '5px 12px', height: 'auto' }} onClick={() => setDestOpen(true)}>+ Add</button>
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
                  <button onClick={() => openEditDest(dest)} title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', fontSize: '13px', padding: '4px 8px' }}>✎</button>
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
              <button style={{ ...btnPrimary, background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', fontSize: '13px', padding: '5px 12px', height: 'auto' }} onClick={openBagModal}>
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
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit trip"
        onSubmit={handleEditTrip}
        submitting={updateTrip.isPending}
        submitLabel="Save"
        error={editErr}
      >
        <Field label="Name" error={editNameErr}>
          <input type="text" autoFocus value={editName} onChange={e => setEditName(e.target.value)} />
        </Field>
        <Field label="Start date">
          <input type="date" value={editStart} onChange={e => setEditStart(e.target.value)} />
        </Field>
        <Field label="End date">
          <input type="date" value={editEnd} onChange={e => setEditEnd(e.target.value)} />
        </Field>
      </FormModal>

      {/* Add/edit destination modal */}
      <FormModal
        open={destOpen}
        onClose={closeDestModal}
        title={editingDest ? 'Edit destination' : 'Add destination'}
        onSubmit={handleAddDestination}
        submitting={addDest.isPending || updateDest.isPending}
        submitLabel={editingDest ? 'Save' : 'Add'}
        error={destErr}
      >
        <Field label="City" error={destCityErr}>
          <input type="text" placeholder="e.g. Paris" autoFocus value={destCity} onChange={e => setDestCity(e.target.value)} />
        </Field>
        <Field label="Country" error={destCountryErr}>
          <input type="text" placeholder="e.g. France" value={destCountry} onChange={e => setDestCountry(e.target.value)} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
          <Field label="Arrival">
            <input type="date" value={destArrival} onChange={e => setDestArrival(e.target.value)} />
          </Field>
          <Field label="Departure">
            <input type="date" value={destDeparture} onChange={e => setDestDeparture(e.target.value)} />
          </Field>
        </div>
      </FormModal>

      <CreateBagModal open={createBagOpen} onClose={() => setCreateBagOpen(false)} onCreated={handleBagCreated} />

      {/* Assign bag modal */}
      <FormModal
        open={bagOpen}
        onClose={() => setBagOpen(false)}
        title="Assign bag"
        onSubmit={handleAssignBag}
        submitting={assignBag.isPending}
        submitLabel="Assign"
        error={bagErr}
      >
        <Field label="Bag">
          <select value={selectedBagId} onChange={e => setSelectedBagId(e.target.value)} style={{ cursor: 'pointer' }}>
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
