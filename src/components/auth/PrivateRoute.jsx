//Location: /src/components/auth/PrivateRoute.jsx
import React, { useEffect } from 'react'
import { navigate } from 'gatsby'
import { useAuth } from './AuthContext'
import Loading from '../common/Loading'

const PrivateRoute = ({ children, redirectTo = '/login' }) => {
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate(redirectTo)
    }
  }, [loading, isAuthenticated, redirectTo])

  if (loading) {
    return <Loading />
  }

  if (!isAuthenticated) {
    return null
  }

  return children
}

export default PrivateRoute