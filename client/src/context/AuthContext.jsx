import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setIsAuthenticated(true)
        setAdmin(data.admin)
      } else {
        setIsAuthenticated(false)
        setAdmin(null)
      }
    } catch (error) {
      setIsAuthenticated(false)
      setAdmin(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsAuthenticated(false)
      setAdmin(null)
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, admin, setAdmin, loading, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}