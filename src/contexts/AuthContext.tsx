import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
}

interface AuthContextValue {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<boolean>
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({ user: null, token: null, loading: true, error: null })

  useEffect(() => {
    const loadAuth = () => {
      try {
        const token = localStorage.getItem('token')
        const user = localStorage.getItem('user')
        if (token && user) {
          setAuth({ user: JSON.parse(user), token, loading: false, error: null })
        } else {
          setAuth(prev => ({ ...prev, loading: false }))
        }
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setAuth({ user: null, token: null, loading: false, error: null })
      }
    }
    loadAuth()
  }, [])

  const verifyToken = useCallback(async (token: string) => {
    const response = await fetch('/api/auth/verify', {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
    if (response.ok) {
      const data = await response.json()
      return data.data.user as User
    }
    throw new Error('Token inválido')
  }, [])

  const login = async (email: string, password: string) => {
    setAuth(prev => ({ ...prev, loading: true, error: null }))
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()
      if (response.ok && data.success) {
        const { user, token } = data.data
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        setAuth({ user, token, loading: false, error: null })
        return { success: true }
      } else {
        const error = data.message || 'Erro ao fazer login'
        setAuth(prev => ({ ...prev, loading: false, error }))
        return { success: false, error }
      }
    } catch {
      const errorMessage = 'Erro de conexão com o servidor'
      setAuth(prev => ({ ...prev, loading: false, error: errorMessage }))
      return { success: false, error: errorMessage }
    }
  }

  const logout = async () => {
    try {
      if (auth.token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' },
        }).catch(() => {})
      }
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setAuth({ user: null, token: null, loading: false, error: null })
    }
  }

  const checkAuth = useCallback(async () => {
    const token = auth.token || localStorage.getItem('token')
    if (!token) return false
    try {
      const user = await verifyToken(token)
      localStorage.setItem('user', JSON.stringify(user))
      setAuth(prev => ({ ...prev, user, token, error: null }))
      return true
    } catch {
      await logout()
      return false
    }
  }, [auth.token, verifyToken])

  const updateUser = (user: User) => {
    localStorage.setItem('user', JSON.stringify(user))
    setAuth(prev => ({ ...prev, user }))
  }

  const value: AuthContextValue = {
    user: auth.user,
    token: auth.token,
    loading: auth.loading,
    error: auth.error,
    isAuthenticated: !!auth.user && !!auth.token,
    login,
    logout,
    checkAuth,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}