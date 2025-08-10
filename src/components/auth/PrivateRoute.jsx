/* ========== /src/components/auth/PrivateRoute.jsx ========== */
// JavaScript Code
import React, { useEffect } from 'react'
import { navigate } from 'gatsby'
import { useAuth } from './AuthContext'
import Loading from '../common/Loading'

const PrivateRoute = ({ children, location }) => {
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const currentPath = location?.pathname || '/'
      navigate(`/login?from=${encodeURIComponent(currentPath)}`)
    }
  }, [isAuthenticated, loading, location])

  if (loading) {
    return <Loading />
  }

  if (!isAuthenticated) {
    return null
  }

  return children
}

export default PrivateRoute