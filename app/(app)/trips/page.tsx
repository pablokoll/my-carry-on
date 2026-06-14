'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api, clearTokens } from '@/lib/api'
import { CreateTripModal } from '@/components/create-trip-modal'

interface Trip {
  id: number
  name: string
  is_active: boolean
  start_date: string | null
  end_date: string | null
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

export default function TripsPage() {
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    api.get<Trip[]>('/trips')
      .then(setTrips)
      .catch(() => { clearTokens(); router.replace('/login') })
      .finally(() => setLoading(false))
  }, [router])

  function handleTripCreated(trip: Trip) { setTrips(prev => [trip, ...prev]) }

  if (loading) {
    return <p style={{ color: 'var(--fg-muted)', fontSize: '14px', textAlign: 'center', paddingTop: '48px' }}>Loading…</p>
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>Trips</h2>
        <button style={btnPrimary} onClick={() => setModalOpen(true)}>New trip</button>
      </div>

      {trips.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: '64px' }}>
          <p style={{ color: 'var(--fg-muted)', fontSize: '15px', marginBottom: '20px' }}>No trips yet.</p>
          <button style={btnPrimary} onClick={() => setModalOpen(true)}>Plan your first trip</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {trips.map(trip => (
            <Link key={trip.id} href={`/trips/${trip.id}`} style={{ textDecoration: 'none' }}>
              <div
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'box-shadow var(--duration-2) var(--ease), transform var(--duration-2) var(--ease)',
                  boxShadow: 'var(--shadow-xs)',
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = 'var(--shadow-md)'; el.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = 'var(--shadow-xs)'; el.style.transform = 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)' }}>{trip.name}</span>
                  {trip.is_active && (
                    <span style={{ fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '99px', background: 'rgba(74,123,181,0.1)', color: 'var(--primary)' }}>Active</span>
                  )}
                </div>
                {(trip.start_date || trip.end_date) && (
                  <p style={{ fontSize: '13px', color: 'var(--fg-muted)', marginTop: '4px', marginBottom: 0 }}>
                    {trip.start_date ?? '—'} → {trip.end_date ?? '—'}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateTripModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={handleTripCreated} />
    </>
  )
}
