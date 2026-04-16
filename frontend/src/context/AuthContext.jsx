import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)  // true while restoring session

  // On app load — restore token from sessionStorage and re-fetch profile
  useEffect(() => {
    const savedToken = sessionStorage.getItem('auth_token')
    if (savedToken) {
      window.__auth_token__ = savedToken
      api.get('/auth/me')
        .then(({ data }) => setUser(data))
        .catch(() => {
          // Token expired or invalid — clear it
          sessionStorage.removeItem('auth_token')
          window.__auth_token__ = null
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  async function login(email, password, tenantId) {
    const { data: tokenData } = await api.post('/auth/login', {
      email,
      password,
      tenant_id: tenantId,
    })

    // Store in memory (for interceptor) and sessionStorage (survives refresh)
    window.__auth_token__ = tokenData.access_token
    sessionStorage.setItem('auth_token', tokenData.access_token)

    const { data: profile } = await api.get('/auth/me')
    setUser(profile)
    return profile
  }

  function logout() {
    window.__auth_token__ = null
    sessionStorage.removeItem('auth_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
