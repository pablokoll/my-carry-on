'use client'

import Link from 'next/link'

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'var(--background)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px',
  fontFamily: 'var(--font-roboto), system-ui, sans-serif',
}

const wrapperStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '380px',
}

const brandStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '32px',
}

const cardStyle: React.CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '28px 24px',
  boxShadow: 'var(--shadow-sm)',
}

export const inputStyle = (hasError: boolean): React.CSSProperties => ({
  width: '100%',
  height: '40px',
  padding: '0 12px',
  fontSize: '14px',
  color: 'var(--foreground)',
  background: 'var(--background)',
  border: `1px solid ${hasError ? 'var(--destructive)' : 'var(--border)'}`,
  borderRadius: '8px',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color var(--duration-2) var(--ease)',
})

export const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--foreground)',
  marginBottom: '6px',
}

export const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0',
}

export const errorStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--destructive)',
  marginTop: '4px',
}

export const submitBtnStyle = (disabled: boolean): React.CSSProperties => ({
  width: '100%',
  height: '42px',
  background: disabled ? 'var(--fg-muted)' : 'var(--primary)',
  color: '#fff',
  fontWeight: 600,
  fontSize: '14px',
  border: 'none',
  borderRadius: '8px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'background var(--duration-2) var(--ease)',
  marginTop: '4px',
})

export const footerLinkStyle: React.CSSProperties = {
  color: 'var(--primary)',
  fontWeight: 500,
  textDecoration: 'none',
}

interface AuthShellProps {
  title: string
  description: string
  footer: React.ReactNode
  children: React.ReactNode
}

export function AuthShell({ title, description, footer, children }: AuthShellProps) {
  return (
    <div style={pageStyle}>
      <div style={wrapperStyle}>
        <div style={brandStyle}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
            My Carry-On
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--fg-muted)', marginTop: '6px', margin: '6px 0 0' }}>
            Pack smarter, travel lighter.
          </p>
        </div>

        <div style={cardStyle}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--foreground)', margin: '0 0 4px' }}>
            {title}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--fg-muted)', margin: '0 0 24px' }}>
            {description}
          </p>

          {children}

          <p style={{ fontSize: '13px', color: 'var(--fg-muted)', textAlign: 'center', marginTop: '20px' }}>
            {footer}
          </p>
        </div>
      </div>
    </div>
  )
}
