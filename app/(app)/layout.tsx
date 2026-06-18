'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/nav'
import { ChatWindow } from '@/components/chat-window'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    if (!localStorage.getItem('access_token')) {
      router.replace('/login')
    }
  }, [router])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', fontFamily: 'var(--font-roboto), system-ui, sans-serif' }}>
      <Nav />
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 16px' }}>
        {children}
      </main>
      <ChatWindow />
    </div>
  )
}
