'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { clearTokens } from '@/lib/api'
import { useTrips, useCreateTrip } from '@/lib/queries'
import { CreateTripModal } from '@/components/create-trip-modal'
import type { Trip } from '@/lib/queries'

interface BagSummary {
  id: number
  name: string
  type: string
  items_total: number
  items_packed: number
}

const btnPrimary: React.CSSProperties = {
  background: 'var(--primary)',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '8px 16px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
}

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function daysUntil(d: string | null): number | null {
  if (!d) return null
  const diff = new Date(d + 'T00:00:00').getTime() - new Date().setHours(0, 0, 0, 0)
  return Math.ceil(diff / 86400000)
}

function ProgressBar({ value, total, color = 'var(--primary)' }: { value: number; total: number; color?: string }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100)
  return (
    <div style={{ position: 'relative', height: '6px', borderRadius: '99px', background: 'var(--border)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct}%`, background: color, borderRadius: '99px', transition: 'width 400ms ease' }} />
    </div>
  )
}

function ActiveTripCard({ trip }: { trip: Trip }) {
  const days = daysUntil(trip.start_date)
  const pct = (trip.items_total ?? 0) === 0 ? 0 : Math.round(((trip.items_packed ?? 0) / (trip.items_total ?? 1)) * 100)
  const allDone = (trip.items_total ?? 0) > 0 && trip.items_packed === trip.items_total
  const bags = (trip.bags ?? []) as BagSummary[]

  return (
    <Link href={`/trips/${trip.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '20px',
        marginBottom: '28px',
        boxShadow: 'var(--shadow-sm)',
        cursor: 'pointer',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '99px', background: allDone ? 'rgba(94,164,110,0.15)' : 'rgba(74,123,181,0.1)', color: allDone ? '#5ea46e' : 'var(--primary)', letterSpacing: '0.04em' }}>
                {allDone ? 'READY' : 'ACTIVE'}
              </span>
              {days !== null && (
                <span style={{ fontSize: '12px', color: 'var(--fg-muted)' }}>
                  {days === 0 ? 'Today!' : days < 0 ? `${Math.abs(days)}d ago` : `${days}d to go`}
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>{trip.name}</h2>
            {(trip.start_date || trip.end_date) && (
              <p style={{ fontSize: '13px', color: 'var(--fg-muted)', margin: '4px 0 0' }}>
                {formatDate(trip.start_date) ?? '—'} → {formatDate(trip.end_date) ?? '—'}
              </p>
            )}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: allDone ? '#5ea46e' : 'var(--primary)', lineHeight: 1 }}>{pct}%</div>
            <div style={{ fontSize: '11px', color: 'var(--fg-muted)', marginTop: '2px' }}>packed</div>
          </div>
        </div>

        {(trip.items_total ?? 0) > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <ProgressBar value={trip.items_packed ?? 0} total={trip.items_total ?? 0} color={allDone ? '#5ea46e' : 'var(--primary)'} />
            <p style={{ fontSize: '12px', color: 'var(--fg-muted)', margin: '6px 0 0' }}>
              {trip.items_packed} / {trip.items_total} items packed
            </p>
          </div>
        )}

        {bags.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {bags.map(bag => {
              const bagDone = bag.items_total > 0 && bag.items_packed === bag.items_total
              return (
                <div key={bag.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)' }}>{bag.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--fg-muted)', background: 'var(--bg-surface)', borderRadius: '4px', padding: '1px 6px' }}>{bag.type}</span>
                    </div>
                    <span style={{ fontSize: '12px', color: bagDone ? '#5ea46e' : 'var(--fg-muted)', fontWeight: bagDone ? 600 : 400 }}>
                      {bag.items_total === 0 ? 'empty' : bagDone ? 'done' : `${bag.items_packed}/${bag.items_total}`}
                    </span>
                  </div>
                  <ProgressBar value={bag.items_packed} total={bag.items_total} color={bagDone ? '#5ea46e' : 'var(--primary)'} />
                </div>
              )
            })}
          </div>
        )}

        {bags.length === 0 && (
          <p style={{ fontSize: '13px', color: 'var(--fg-muted)', margin: 0 }}>No bags assigned yet.</p>
        )}
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const { data: trips = [], isLoading, isError } = useTrips()
  const createTrip = useCreateTrip()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) { router.replace('/login') }
  }, [router])

  useEffect(() => {
    if (isError) { clearTokens(); router.replace('/login') }
  }, [isError, router])

  if (isLoading) {
    return <p style={{ color: 'var(--fg-muted)', fontSize: '14px', textAlign: 'center', paddingTop: '48px' }}>Loading…</p>
  }

  const activeTrip = trips.find((t: Trip) => t.is_active)
  const otherTrips = trips.filter((t: Trip) => !t.is_active)

  return (
    <>
      {activeTrip && <ActiveTripCard trip={activeTrip} />}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>
          {activeTrip ? 'Other trips' : 'Your trips'}
        </h2>
        <button style={btnPrimary} onClick={() => setModalOpen(true)}>New trip</button>
      </div>

      {trips.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: '48px' }}>
          <p style={{ color: 'var(--fg-muted)', fontSize: '15px', marginBottom: '20px' }}>No trips yet.</p>
          <button style={btnPrimary} onClick={() => setModalOpen(true)}>Plan your first trip</button>
        </div>
      ) : otherTrips.length === 0 && activeTrip ? (
        <p style={{ fontSize: '13px', color: 'var(--fg-muted)' }}>No other trips.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {otherTrips.map((trip: Trip) => (
            <Link key={trip.id} href={`/trips/${trip.id}`} style={{ textDecoration: 'none' }}>
              <div
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
              >
                <div style={{ minWidth: 0 }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trip.name}</span>
                  {(trip.start_date || trip.end_date) && (
                    <span style={{ fontSize: '12px', color: 'var(--fg-muted)' }}>
                      {formatDate(trip.start_date) ?? '—'} → {formatDate(trip.end_date) ?? '—'}
                    </span>
                  )}
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  {(trip.items_total ?? 0) > 0 ? (
                    <span style={{ fontSize: '12px', color: 'var(--fg-muted)' }}>
                      {Math.round(((trip.items_packed ?? 0) / (trip.items_total ?? 1)) * 100)}% packed
                    </span>
                  ) : (
                    <span style={{ fontSize: '12px', color: 'var(--fg-muted)' }}>{(trip.bags ?? []).length} bag{(trip.bags ?? []).length !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateTripModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          setModalOpen(false)
          createTrip.reset()
        }}
      />
    </>
  )
}
