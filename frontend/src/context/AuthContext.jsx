import { createContext, useContext, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  async function login(email, password, tenantId) {
    // 1. Get token
    const { data: tokenData } = await api.post('/auth/login', {
      email,
      password,
      tenant_id: tenantId,
    })

    // 2. Store token in memory (not localStorage — safer)
    window.__auth_token__ = tokenData.access_token

    // 3. Fetch user profile
    const { data: profile } = await api.get('/auth/me')
    setUser(profile)

    return profile
  }

  function logout() {
    window.__auth_token__ = null
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}