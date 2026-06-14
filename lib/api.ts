const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? '') + '/api'

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('access_token')
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('access_token', accessToken)
  localStorage.setItem('refresh_token', refreshToken)
}

export function clearTokens() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) return null

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${refreshToken}` },
  })
  if (!res.ok) {
    clearTokens()
    return null
  }
  const data = await res.json()
  localStorage.setItem('access_token', data.access_token)
  return data.access_token
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let token = getAccessToken()

  const makeRequest = (t: string | null) =>
    fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
        ...(options.headers ?? {}),
      },
    })

  let res = await makeRequest(token)

  if (res.status === 401 && token) {
    token = await refreshAccessToken()
    if (token) res = await makeRequest(token)
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }))
    const e = new Error(err.message ?? 'Request failed') as Error & { status: number }
    e.status = res.status
    throw e
  }

  return res.json() as Promise<T>
}

export const api = {
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  get: <T>(path: string) =>
    request<T>(path, { method: 'GET' }),

  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),

  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
}
