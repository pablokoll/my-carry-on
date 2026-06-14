'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api, clearTokens } from '@/lib/api'
import { FormModal, Field } from '@/components/ui/form-modal'
import { CreateBagModal, type Bag } from '@/components/create-bag-modal'
import { BagItemsTable, type Item, type Category } from '@/components/bag-items-table'

interface Trip {
  id: number
  name: string
  is_active: boolean
  start_date: string | null
  end_date: string | null
}

interface Destination {
  id: number
  city: string
  country: string
  arrival_date: string | null
  departure_date: string | null
}


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

const sectionHeader: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: 'var(--foreground)',
  marginBottom: '12px',
  marginTop: 0,
}

const rowStyle: React.CSSProperties = {
  background: 'var(--bg-surface)',
  borderRadius: '8px',
  padding: '12px 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
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

export default function TripPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)

  // edit trip
  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editStart, setEditStart] = useState('')
  const [editEnd, setEditEnd] = useState('')
  const [editNameErr, setEditNameErr] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editErr, setEditErr] = useState('')

  // destinations
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [destLoading, setDestLoading] = useState(true)
  const [destOpen, setDestOpen] = useState(false)
  const [destCity, setDestCity] = useState('')
  const [destCountry, setDestCountry] = useState('')
  const [destArrival, setDestArrival] = useState('')
  const [destDeparture, setDestDeparture] = useState('')
  const [destCityErr, setDestCityErr] = useState('')
  const [destCountryErr, setDestCountryErr] = useState('')
  const [destSubmitting, setDestSubmitting] = useState(false)
  const [destErr, setDestErr] = useState('')
  const [editingDest, setEditingDest] = useState<Destination | null>(null)

  // bags
  const [allBags, setAllBags] = useState<Bag[]>([])
  const [assignedBags, setAssignedBags] = useState<Bag[]>([])
  const [bagOpen, setBagOpen] = useState(false)
  const [createBagOpen, setCreateBagOpen] = useState(false)
  const [selectedBagId, setSelectedBagId] = useState('')
  const [bagSubmitting, setBagSubmitting] = useState(false)
  const [bagErr, setBagErr] = useState('')
  // bag items & categories for inline table
  const [bagItems, setBagItems] = useState<Record<number, Item[]>>({})
  const [categories, setCategories] = useState<Category[]>([])
  const [expandedBags, setExpandedBags] = useState<Set<number>>(new Set())

  useEffect(() => {
    api.get<Trip>(`/trips/${id}`)
      .then(setTrip)
      .catch((e: Error & { status?: number }) => {
        if (e.status === 401) { clearTokens(); router.replace('/login') }
      })
      .finally(() => setLoading(false))

    api.get<Destination[]>(`/trips/${id}/destinations`)
      .then(setDestinations)
      .finally(() => setDestLoading(false))

    api.get<Bag[]>('/bags').then(bags => {
      setAllBags(bags)
      if (bags.length > 0) setSelectedBagId(String(bags[0].id))
    })

    api.get<Category[]>('/categories').then(setCategories)

    api.get<(Bag & { items: Item[] })[]>(`/trips/${id}/bags`)
      .then(bags => {
        setAssignedBags(bags.map(b => ({ id: b.id, name: b.name, type: b.type })))
        const itemsMap: Record<number, Item[]> = {}
        bags.forEach(b => { itemsMap[b.id] = b.items ?? [] })
        setBagItems(itemsMap)
      })
  }, [id, router])

  // --- edit trip ---
  function openEdit() {
    if (!trip) return
    setEditName(trip.name)
    setEditStart(trip.start_date ?? '')
    setEditEnd(trip.end_date ?? '')
    setEditNameErr('')
    setEditErr('')
    setEditOpen(true)
  }

  function closeEdit() { setEditOpen(false); setEditNameErr(''); setEditErr('') }

  async function handleEditTrip() {
    if (!editName.trim()) { setEditNameErr('Name is required'); return }
    setEditNameErr(''); setEditErr(''); setEditSubmitting(true)
    try {
      const updated = await api.put<Trip>(`/trips/${id}`, {
        name: editName.trim(),
        start_date: editStart || null,
        end_date: editEnd || null,
      })
      setTrip(updated)
      closeEdit()
    } catch (e) {
      setEditErr(e instanceof Error ? e.message : 'Failed to update trip')
    } finally {
      setEditSubmitting(false)
    }
  }

  // --- destinations ---
  function closeDestModal() {
    setDestOpen(false)
    setEditingDest(null)
    setDestCity(''); setDestCountry(''); setDestArrival(''); setDestDeparture('')
    setDestCityErr(''); setDestCountryErr(''); setDestErr('')
  }

  function openEditDest(dest: Destination) {
    setEditingDest(dest)
    setDestCity(dest.city)
    setDestCountry(dest.country)
    setDestArrival(dest.arrival_date ?? '')
    setDestDeparture(dest.departure_date ?? '')
    setDestCityErr(''); setDestCountryErr(''); setDestErr('')
    setDestOpen(true)
  }

  async function handleAddDestination() {
    let valid = true
    if (!destCity.trim()) { setDestCityErr('City is required'); valid = false } else setDestCityErr('')
    if (!destCountry.trim()) { setDestCountryErr('Country is required'); valid = false } else setDestCountryErr('')
    if (!valid) return
    setDestErr(''); setDestSubmitting(true)
    try {
      if (editingDest) {
        const updated = await api.put<Destination>(`/destinations/${editingDest.id}`, {
          city: destCity.trim(),
          country: destCountry.trim(),
          arrival_date: destArrival || null,
          departure_date: destDeparture || null,
        })
        setDestinations(prev => prev.map(d => d.id === updated.id ? updated : d))
      } else {
        const dest = await api.post<Destination>(`/trips/${id}/destinations`, {
          city: destCity.trim(),
          country: destCountry.trim(),
          arrival_date: destArrival || null,
          departure_date: destDeparture || null,
        })
        setDestinations(prev => [...prev, dest])
      }
      closeDestModal()
    } catch (e) {
      setDestErr(e instanceof Error ? e.message : editingDest ? 'Failed to update destination' : 'Failed to add destination')
    } finally {
      setDestSubmitting(false)
    }
  }

  async function handleDeleteDestination(destId: number) {
    try {
      await api.delete(`/destinations/${destId}`)
      setDestinations(prev => prev.filter(d => d.id !== destId))
    } catch { /* silent */ }
  }

  // --- bags ---
  const unassignedBags = allBags.filter(b => !assignedBags.find(a => a.id === b.id))

  function openBagModal() {
    const first = unassignedBags[0]
    setSelectedBagId(first ? String(first.id) : '')
    setBagErr('')
    setBagOpen(true)
  }

  function closeBagModal() { setBagOpen(false); setBagErr('') }

  async function handleAssignBag() {
    if (!selectedBagId) return
    setBagSubmitting(true); setBagErr('')
    try {
      await api.post(`/trips/${id}/bags`, { bag_id: Number(selectedBagId) })
      const bag = allBags.find(b => b.id === Number(selectedBagId))
      if (bag) {
        setAssignedBags(prev => [...prev, bag])
        setBagItems(prev => ({ ...prev, [bag.id]: prev[bag.id] ?? [] }))
      }
      closeBagModal()
    } catch (e) {
      setBagErr(e instanceof Error ? e.message : 'Failed to assign bag')
    } finally {
      setBagSubmitting(false)
    }
  }

  async function handleUnassignBag(bagId: number) {
    try {
      await api.delete(`/trips/${id}/bags/${bagId}`)
      setAssignedBags(prev => prev.filter(b => b.id !== bagId))
    } catch { /* silent */ }
  }

  async function handleBagCreated(bag: Bag) {
    setAllBags(prev => [...prev, bag])
    try {
      await api.post(`/trips/${id}/bags`, { bag_id: bag.id })
      setAssignedBags(prev => [...prev, bag])
      setBagItems(prev => ({ ...prev, [bag.id]: [] }))
    } catch { /* silent */ }
  }

  if (loading) return <p style={{ color: 'var(--fg-muted)', fontSize: '14px', textAlign: 'center', paddingTop: '48px' }}>Loading…</p>
  if (!trip) return <p style={{ color: 'var(--destructive)', textAlign: 'center', paddingTop: '48px' }}>Trip not found.</p>

  return (
    <>
      {/* Trip header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>{trip.name}</h2>
            {trip.is_active && (
              <span style={{ fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '99px', background: 'rgba(74,123,181,0.1)', color: 'var(--primary)' }}>Active</span>
            )}
          </div>
          {(trip.start_date || trip.end_date) && (
            <p style={{ fontSize: '13px', color: 'var(--fg-muted)', margin: 0 }}>
              {trip.start_date ?? '—'} → {trip.end_date ?? '—'}
            </p>
          )}
        </div>
        <button onClick={openEdit} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', color: 'var(--fg-secondary)', cursor: 'pointer' }}>
          Edit
        </button>
      </div>

      {/* Destinations */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 style={sectionHeader}>Destinations</h3>
          <button style={btnPrimary} onClick={() => setDestOpen(true)}>Add destination</button>
        </div>
        {destLoading ? (
          <p style={{ color: 'var(--fg-muted)', fontSize: '14px' }}>Loading…</p>
        ) : destinations.length === 0 ? (
          <p style={{ color: 'var(--fg-muted)', fontSize: '14px' }}>No destinations yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {destinations.map(dest => (
              <div key={dest.id} style={rowStyle}>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--foreground)' }}>{dest.city}, {dest.country}</span>
                  {(dest.arrival_date || dest.departure_date) && (
                    <p style={{ fontSize: '12px', color: 'var(--fg-muted)', margin: '2px 0 0' }}>
                      {dest.arrival_date ?? '—'} → {dest.departure_date ?? '—'}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button style={{ ...btnDestructive, color: 'var(--fg-secondary)' }} onClick={() => openEditDest(dest)}>Edit</button>
                  <button style={btnDestructive} onClick={() => handleDeleteDestination(dest.id)}>Remove</button>
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
          <div style={{ display: 'flex', gap: '8px' }}>
            {unassignedBags.length > 0 && <button style={{ ...btnPrimary, background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)' }} onClick={openBagModal}>Assign bag</button>}
            <button style={btnPrimary} onClick={() => setCreateBagOpen(true)}>New bag</button>
          </div>
        </div>
        {assignedBags.length === 0 ? (
          <p style={{ color: 'var(--fg-muted)', fontSize: '14px' }}>
            Bags assigned to this trip appear here.
            {allBags.length === 0 && ' Create bags first from the Bags page.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {assignedBags.map(bag => {
              const expanded = expandedBags.has(bag.id)
              return (
                <div key={bag.id} style={{ background: 'var(--bg-surface)', borderRadius: '10px', overflow: 'hidden' }}>
                  {/* Bag header row */}
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
                      {bagItems[bag.id] && (
                        <span style={{ fontSize: '12px', color: 'var(--fg-muted)' }}>
                          {bagItems[bag.id].filter(i => i.packed).length}/{bagItems[bag.id].length} packed
                        </span>
                      )}
                    </button>
                    <button style={btnDestructive} onClick={() => handleUnassignBag(bag.id)}>Remove</button>
                  </div>
                  {/* Expanded items table */}
                  {expanded && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px' }}>
                      <BagItemsTable
                        bagId={bag.id}
                        initialItems={bagItems[bag.id] ?? []}
                        categories={categories}
                        onItemsChange={items => setBagItems(prev => ({ ...prev, [bag.id]: items }))}
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
        onClose={closeEdit}
        title="Edit trip"
        onSubmit={handleEditTrip}
        submitting={editSubmitting}
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
        submitting={destSubmitting}
        submitLabel={editingDest ? 'Save' : 'Add'}
        error={destErr}
      >
        <Field label="City" error={destCityErr}>
          <input type="text" placeholder="e.g. Paris" autoFocus value={destCity} onChange={e => setDestCity(e.target.value)} />
        </Field>
        <Field label="Country" error={destCountryErr}>
          <input type="text" placeholder="e.g. France" value={destCountry} onChange={e => setDestCountry(e.target.value)} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label="Arrival">
            <input type="date" value={destArrival} onChange={e => setDestArrival(e.target.value)} />
          </Field>
          <Field label="Departure">
            <input type="date" value={destDeparture} onChange={e => setDestDeparture(e.target.value)} />
          </Field>
        </div>
      </FormModal>

      <CreateBagModal
        open={createBagOpen}
        onClose={() => setCreateBagOpen(false)}
        onCreated={handleBagCreated}
      />

      {/* Assign bag modal */}
      <FormModal
        open={bagOpen}
        onClose={closeBagModal}
        title="Assign bag"
        onSubmit={handleAssignBag}
        submitting={bagSubmitting}
        submitLabel="Assign"
        error={bagErr}
      >
        <Field label="Bag">
          <select value={selectedBagId} onChange={e => setSelectedBagId(e.target.value)} style={{ cursor: 'pointer' }}>
            {unassignedBags.map(b => (
              <option key={b.id} value={String(b.id)}>{b.name} ({b.type})</option>
            ))}
          </select>
        </Field>
      </FormModal>
    </>
  )
}
