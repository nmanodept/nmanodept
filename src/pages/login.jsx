//Location: /src/pages/login.jsx
import React, { useState, useEffect } from 'react'
import { Link, navigate } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import LoginForm from '../components/forms/LoginForm'
import { useAuth } from '../components/auth/AuthContext'
import './auth.css'

const LoginPage = ({ location }) => {
  const { login, isAuthenticated } = useAuth()
  const [error, setError] = useState('')
  const [from, setFrom] = useState('/')

  useEffect(() => {
    // 如果已經登入，重定向
    if (isAuthenticated) {
      navigate(from)
    }
    
    // 檢查是否有重定向來源
    const params = new URLSearchParams(location.search)
    const redirectFrom = params.get('from')
    if (redirectFrom) {
      setFrom(redirectFrom)
    }
  }, [isAuthenticated, location, from])

  const handleLogin = async (formData) => {
    setError('')
    const result = await login(formData.username, formData.password)
    
    if (result.success) {
      navigate(from)
    } else {
      setError(result.error)
    }
  }

  return (
    <Layout>
      <Seo title="登入" />
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">登入</h1>
          <p className="auth-subtitle">登入您的帳號以管理作品</p>
          
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <LoginForm onSubmit={handleLogin} />

          <div className="auth-footer">
            <p>還沒有帳號？<Link to="/register">立即註冊</Link></p>
            <p><Link to="/forgot-password">忘記密碼？</Link></p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default LoginPage