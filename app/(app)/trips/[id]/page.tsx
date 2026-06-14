'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api, clearTokens } from '@/lib/api'

interface Trip {
  id: number
  name: string
  is_active: boolean
  start_date: string | null
  end_date: string | null
}

export default function TripPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Trip>(`/trips/${id}`)
      .then(setTrip)
      .catch(() => { clearTokens(); router.replace('/login') })
      .finally(() => setLoading(false))
  }, [id, router])

  if (loading) {
    return <p style={{ color: 'var(--fg-muted)', fontSize: '14px', textAlign: 'center', paddingTop: '48px' }}>Loading…</p>
  }

  if (!trip) {
    return <p style={{ color: 'var(--destructive)', textAlign: 'center', paddingTop: '48px' }}>Trip not found.</p>
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 4px' }}>{trip.name}</h2>
        {(trip.start_date || trip.end_date) && (
          <p style={{ fontSize: '13px', color: 'var(--fg-muted)', margin: 0 }}>
            {trip.start_date ?? '—'} → {trip.end_date ?? '—'}
          </p>
        )}
      </div>

      <p style={{ color: 'var(--fg-muted)', fontSize: '14px' }}>Destinations and bags coming soon.</p>
    </div>
  )
}
