//Location: /src/components/auth/AuthContext.jsx (完整更新)
import React, { createContext, useContext, useState, useEffect } from 'react'
import { navigate } from 'gatsby'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const checkAuth = async () => {
      // 檢查是否在瀏覽器環境
      if (typeof window === 'undefined') {
        setLoading(false)
        return
      }

      try {
        const token = localStorage.getItem('authToken')
        if (token) {
          const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
          const response = await fetch(`${apiUrl}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (response.ok) {
            const userData = await response.json()
            setUser(userData)
          } else {
            localStorage.removeItem('authToken')
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (username, password) => {
    setError(null)
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (response.ok) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', data.token)
        }
        setUser(data.user)
        return { success: true }
      } else {
        setError(data.error)
        return { success: false, error: data.error }
      }
    } catch (error) {
      setError('登入失敗，請稍後再試')
      return { success: false, error: '登入失敗，請稍後再試' }
    }
  }

  const register = async (userData) => {
    setError(null)
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      const data = await response.json()

      if (response.ok) {
        return { success: true, message: data.message }
      } else {
        setError(data.error)
        return { success: false, error: data.error }
      }
    } catch (error) {
      setError('註冊失敗，請稍後再試')
      return { success: false, error: '註冊失敗，請稍後再試' }
    }
  }

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken')
    }
    setUser(null)
    if (typeof navigate === 'function') {
      navigate('/login')
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
      
      if (!token) {
        return { success: false, error: '未登入' }
      }
      
      const response = await fetch(`${apiUrl}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      })

      if (response.ok) {
        const data = await response.json()
        setUser(prev => ({ ...prev, ...data }))
        return { success: true }
      } else {
        const error = await response.json()
        return { success: false, error: error.error }
      }
    } catch (error) {
      return { success: false, error: '更新失敗' }
    }
  }

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}