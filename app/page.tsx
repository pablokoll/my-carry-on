'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, clearTokens } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Trip {
  id: number
  name: string
  is_active: boolean
  start_date: string | null
  end_date: string | null
}

export default function DashboardPage() {
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.replace('/login')
      return
    }
    api.get<Trip[]>('/trips')
      .then(setTrips)
      .catch(() => {
        clearTokens()
        router.replace('/login')
      })
      .finally(() => setLoading(false))
  }, [router])

  function handleLogout() {
    clearTokens()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-4 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">My Carry-On</h1>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Sign out
        </Button>
      </header>

      <main className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Your trips</h2>
          <Button size="sm">New trip</Button>
        </div>

        {trips.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-muted-foreground">No trips yet.</p>
            <Button>Plan your first trip</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {trips.map(trip => (
              <Card key={trip.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{trip.name}</CardTitle>
                    {trip.is_active && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        Active
                      </span>
                    )}
                  </div>
                </CardHeader>
                {(trip.start_date || trip.end_date) && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">
                      {trip.start_date ?? '—'} → {trip.end_date ?? '—'}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
