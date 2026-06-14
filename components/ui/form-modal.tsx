'use client'

import React from 'react'
import { Dialog } from './dialog'
import { inputStyle, labelStyle, errorStyle } from '@/app/(auth)/auth-layout'

interface FieldProps {
  label: string
  error?: string
  children: React.ReactElement<React.InputHTMLAttributes<HTMLInputElement> | React.SelectHTMLAttributes<HTMLSelectElement>>
}

export function Field({ label, error, children }: FieldProps) {
  const child = React.cloneElement(children, {
    style: {
      ...inputStyle(!!error),
      ...(children.props.style ?? {}),
    },
    onFocus: (e: React.FocusEvent<HTMLInputElement & HTMLSelectElement>) => {
      e.target.style.boxShadow = 'var(--shadow-focus)'
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement & HTMLSelectElement>) => {
      e.target.style.boxShadow = 'none'
    },
  })
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {child}
      {error && <p style={errorStyle}>{error}</p>}
    </div>
  )
}

interface FormModalProps {
  open: boolean
  onClose: () => void
  title: string
  onSubmit: () => void
  submitting?: boolean
  submitLabel?: string
  error?: string
  children: React.ReactNode
}

export function FormModal({ open, onClose, title, onSubmit, submitting, submitLabel = 'Save', error, children }: FormModalProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>{title}</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', fontSize: '18px', lineHeight: 1, padding: '4px' }}>✕</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {children}
        {error && <p style={{ fontSize: '13px', color: 'var(--destructive)', textAlign: 'center', margin: 0 }}>{error}</p>}
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ flex: 1, height: '42px', background: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            style={{ flex: 1, height: '42px', background: submitting ? 'var(--fg-muted)' : 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}
          >
            {submitting ? `${submitLabel}…` : submitLabel}
          </button>
        </div>
      </div>
    </Dialog>
  )
}
