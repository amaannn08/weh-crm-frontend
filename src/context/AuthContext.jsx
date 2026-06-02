import React, { createContext, useContext, useState, useEffect } from 'react'
import { getToken, setToken as persistToken, clearToken } from '../auth'
import { cache } from '../api/cache'
import { clearSessionSnapshot, getUserKeyFromToken } from '../utils/sessionCache'
import { clearPreloadedData } from '../utils/dataPreloader'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(null)
  const [authResolved, setAuthResolved] = useState(false)

  useEffect(() => {
    setTokenState(getToken())
    setAuthResolved(true)
  }, [])

  const login = (newToken) => {
    persistToken(newToken)
    setTokenState(newToken)
    clearPreloadedData()
    setAuthResolved(true)
  }

  const logout = () => {
    const userKey = getUserKeyFromToken(token)
    clearToken()
    cache.clear()
    clearSessionSnapshot(userKey)
    clearPreloadedData()
    setTokenState(null)
    setAuthResolved(true)
  }

  // Automatically log out when any API call receives a 401 (token expired)
  useEffect(() => {
    const handler = () => logout()
    window.addEventListener('auth:expired', handler)
    return () => window.removeEventListener('auth:expired', handler)
  }, [])

  const isAuthenticated = !!token

  return (
    <AuthContext.Provider value={{ token, login, logout, isAuthenticated, authResolved }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
