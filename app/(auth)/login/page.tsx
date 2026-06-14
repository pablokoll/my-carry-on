'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api, setTokens } from '@/lib/api'
import { AuthShell, inputStyle, labelStyle, errorStyle, submitBtnStyle, footerLinkStyle } from '../auth-layout'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setError(null)
    try {
      const res = await api.post<{ access_token: string; refresh_token: string }>('/auth/login', data)
      setTokens(res.access_token, res.refresh_token)
      router.push('/')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed')
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to your account"
      footer={<>Don&apos;t have an account?{' '}<Link href="/register" style={footerLinkStyle}>Sign up</Link></>}
    >
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...register('email')}
            style={inputStyle(!!errors.email)}
            onFocus={e => (e.target.style.boxShadow = 'var(--shadow-focus)')}
            onBlur={e => (e.target.style.boxShadow = 'none')}
          />
          {errors.email && <p style={errorStyle}>{errors.email.message}</p>}
        </div>

        <div>
          <label style={labelStyle}>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            {...register('password')}
            style={inputStyle(!!errors.password)}
            onFocus={e => (e.target.style.boxShadow = 'var(--shadow-focus)')}
            onBlur={e => (e.target.style.boxShadow = 'none')}
          />
          {errors.password && <p style={errorStyle}>{errors.password.message}</p>}
        </div>

        {error && <p style={{ fontSize: '13px', color: 'var(--destructive)', textAlign: 'center' }}>{error}</p>}

        <button type="submit" disabled={isSubmitting} style={submitBtnStyle(isSubmitting)}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  )
}
