import type { CSSProperties } from 'react'

export const btnPrimary: CSSProperties = {
  height: '36px',
  padding: '0 18px',
  background: 'var(--primary)',
  color: 'var(--primary-foreground)',
  border: 'none',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
}

export const btnSecondary: CSSProperties = {
  height: '36px',
  padding: '0 18px',
  background: 'transparent',
  color: 'var(--foreground)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
}

export const btnDestructive: CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--destructive)',
  cursor: 'pointer',
  fontSize: '13px',
  padding: '4px 8px',
}

export const btnGhost: CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--fg-muted)',
  cursor: 'pointer',
  fontSize: '13px',
  padding: '4px 8px',
}

export const btnLink: CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--primary)',
  cursor: 'pointer',
  fontSize: '13px',
  padding: '4px 0',
  fontWeight: 500,
}

export const catSelect: CSSProperties = {
  width: '100%',
  height: '36px',
  padding: '0 8px',
  fontSize: '13px',
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  color: 'var(--foreground)',
  outline: 'none',
  cursor: 'pointer',
}

export const sectionHeader: CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: 'var(--foreground)',
  marginBottom: '12px',
  marginTop: 0,
}

export const rowStyle: CSSProperties = {
  background: 'var(--bg-surface)',
  borderRadius: '8px',
  padding: '12px 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}
