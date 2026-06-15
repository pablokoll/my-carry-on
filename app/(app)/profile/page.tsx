'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, clearTokens } from '@/lib/api'

interface Profile {
  email: string
  created_at: string
  trip_count: number
  destination_count: number
  bag_count: number
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Profile>('/auth/me')
      .then(setProfile)
      .finally(() => setLoading(false))
  }, [])

  function handleLogout() {
    clearTokens()
    router.push('/login')
  }

  if (loading) {
    return <p style={{ color: 'var(--fg-muted)', fontSize: '14px', textAlign: 'center', paddingTop: '48px' }}>Loading…</p>
  }

  if (!profile) return null

  const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>Profile</h2>

      <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <p style={{ fontSize: '12px', color: 'var(--fg-muted)', margin: '0 0 2px' }}>Email</p>
          <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--foreground)', margin: 0 }}>{profile.email}</p>
        </div>
        <div>
          <p style={{ fontSize: '12px', color: 'var(--fg-muted)', margin: '0 0 2px' }}>Member since</p>
          <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--foreground)', margin: 0 }}>{memberSince}</p>
        </div>
      </div>

      <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', padding: '20px' }}>
        <p style={{ fontSize: '12px', color: 'var(--fg-muted)', margin: '0 0 14px' }}>Stats</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
          <div>
            <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)', margin: '0 0 2px' }}>{profile.trip_count}</p>
            <p style={{ fontSize: '12px', color: 'var(--fg-muted)', margin: 0 }}>trips</p>
          </div>
          <div>
            <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)', margin: '0 0 2px' }}>{profile.destination_count}</p>
            <p style={{ fontSize: '12px', color: 'var(--fg-muted)', margin: 0 }}>destinations</p>
          </div>
          <div>
            <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)', margin: '0 0 2px' }}>{profile.bag_count}</p>
            <p style={{ fontSize: '12px', color: 'var(--fg-muted)', margin: 0 }}>bags</p>
          </div>
        </div>
      </div>

      <button
        onClick={handleLogout}
        style={{
          background: 'transparent',
          border: '1px solid var(--destructive)',
          borderRadius: '8px',
          color: 'var(--destructive)',
          padding: '10px 16px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          width: '100%',
        }}
      >
        Sign out
      </button>
    </div>
  )
}
