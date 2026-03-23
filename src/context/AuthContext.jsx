import { createContext, useContext, useState } from 'react'
import api from '../api/config'

const AuthContext = createContext(null)
const STORAGE_KEY = 'akriti_user'

// ── Helper: check if JWT token is expired ─────────────────
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return Date.now() > payload.exp * 1000
  } catch {
    return true // if we can't decode it, treat as expired
  }
}

// ── Helper: get ms until token expires ───────────────────
function msUntilExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 - Date.now()
  } catch {
    return 0
  }
}

export function AuthProvider({ children }) {

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return null

      const userData = JSON.parse(saved)

      // If token is expired, clear storage and force re-login
      if (userData?.token && isTokenExpired(userData.token)) {
        localStorage.removeItem(STORAGE_KEY)
        return null
      }

      return userData
    } catch {
      return null
    }
  })

  const login = (userData) => {
    setUser(userData)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  // ── Check token validity (called by protected routes) ───
  const isAuthenticated = () => {
    if (!user?.token) return false
    if (isTokenExpired(user.token)) {
      logout()
      return false
    }
    return true
  }

  // ── How many days until token expires ───────────────────
  const tokenExpiresInDays = () => {
    if (!user?.token) return 0
    return Math.floor(msUntilExpiry(user.token) / (1000 * 60 * 60 * 24))
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated,
      tokenExpiresInDays,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}