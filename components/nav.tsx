'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clearTokens } from '@/lib/api'

const NAV_LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/trips', label: 'Trips' },
  { href: '/bags', label: 'Bags' },
]

function NavLinks({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  function handleSignOut() {
    clearTokens()
    router.push('/login')
    onClick?.()
  }

  return (
    <>
      {NAV_LINKS.map(({ href, label }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            onClick={onClick}
            style={{
              display: 'block',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: active ? 600 : 400,
              color: active ? 'var(--primary)' : 'var(--fg-secondary)',
              background: active ? 'rgba(74,123,181,0.08)' : 'transparent',
              textDecoration: 'none',
              transition: 'background var(--duration-2) var(--ease), color var(--duration-2) var(--ease)',
            }}
          >
            {label}
          </Link>
        )
      })}
      <button
        onClick={handleSignOut}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'left',
          padding: '10px 14px',
          borderRadius: '8px',
          fontSize: '15px',
          fontWeight: 400,
          color: 'var(--destructive)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          transition: 'background var(--duration-2) var(--ease)',
        }}
      >
        Sign out
      </button>
    </>
  )
}

export function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [menuOpen])

  return (
    <>
      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        height: '56px',
        background: 'var(--card)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        boxShadow: 'var(--shadow-xs)',
      }}>
        <Link href="/" style={{ fontSize: '17px', fontWeight: 700, color: 'var(--foreground)', textDecoration: 'none' }}>
          My Carry-On
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="desktop-nav">
          {NAV_LINKS.map(({ href, label }) => (
            <DesktopNavLink key={href} href={href} label={label} />
          ))}
          <SignOutBtn />
        </nav>

        {/* Mobile burger */}
        <button
          onClick={() => setMenuOpen(v => !v)}
          className="burger-btn"
          aria-label="Menu"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            color: 'var(--foreground)',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
          }}
        >
          <span style={{ display: 'block', width: '22px', height: '2px', background: 'currentColor', borderRadius: '2px', transition: `transform var(--duration-2) var(--ease), opacity var(--duration-2) var(--ease)`, transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
          <span style={{ display: 'block', width: '22px', height: '2px', background: 'currentColor', borderRadius: '2px', opacity: menuOpen ? 0 : 1, transition: `opacity var(--duration-2) var(--ease)` }} />
          <span style={{ display: 'block', width: '22px', height: '2px', background: 'currentColor', borderRadius: '2px', transition: `transform var(--duration-2) var(--ease)`, transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
        </button>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <>
          <div
            onClick={() => setMenuOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 41, background: 'rgba(28,35,51,0.3)', backdropFilter: 'blur(2px)' }}
          />
          <div style={{
            position: 'fixed',
            top: '56px',
            left: 0,
            right: 0,
            zIndex: 42,
            background: 'var(--card)',
            borderBottom: '1px solid var(--border)',
            padding: '12px 12px 16px',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}>
            <NavLinks onClick={() => setMenuOpen(false)} />
          </div>
        </>
      )}

      <style>{`
        .desktop-nav { display: none; }
        .burger-btn { display: flex; }
        @media (min-width: 640px) {
          .desktop-nav { display: flex; }
          .burger-btn { display: none; }
        }
      `}</style>
    </>
  )
}

function DesktopNavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname()
  const active = pathname === href
  return (
    <Link
      href={href}
      style={{
        padding: '6px 12px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: active ? 600 : 400,
        color: active ? 'var(--primary)' : 'var(--fg-secondary)',
        background: active ? 'rgba(74,123,181,0.08)' : 'transparent',
        textDecoration: 'none',
        transition: 'background var(--duration-2) var(--ease), color var(--duration-2) var(--ease)',
      }}
    >
      {label}
    </Link>
  )
}

function SignOutBtn() {
  const router = useRouter()
  return (
    <button
      onClick={() => { clearTokens(); router.push('/login') }}
      style={{
        padding: '6px 12px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 400,
        color: 'var(--destructive)',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        marginLeft: '4px',
      }}
    >
      Sign out
    </button>
  )
}
