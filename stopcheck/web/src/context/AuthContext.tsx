import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface Org {
  id: string
  name: string
  email: string
  plan: string
  sponsored: boolean
  sponsor_charity_name: string | null
}

interface AuthState {
  org: Org | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthState | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [org, setOrg] = useState<Org | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('sc_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) { setLoading(false); return }
    fetch('/api/organizations/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setOrg)
      .catch(() => { localStorage.removeItem('sc_token'); setToken(null) })
      .finally(() => setLoading(false))
  }, [token])

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/organizations/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Login failed')
    }
    const data = await res.json()
    localStorage.setItem('sc_token', data.token)
    setToken(data.token)
    setOrg(data.org)
  }

  const register = async (name: string, email: string, password: string) => {
    const res = await fetch('/api/organizations/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Registration failed')
    }
    const data = await res.json()
    localStorage.setItem('sc_token', data.token)
    setToken(data.token)
    setOrg(data.org)
  }

  const logout = () => {
    localStorage.removeItem('sc_token')
    setToken(null)
    setOrg(null)
  }

  return (
    <AuthContext.Provider value={{ org, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
