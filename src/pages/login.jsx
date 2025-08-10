// /src/pages/login.jsx
import React, { useState, useEffect } from 'react'
import { Link, navigate } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import { useAuth } from '../components/auth/AuthContext'
import './auth.css'

const LoginPage = ({ location }) => {
  const { login, isAuthenticated } = useAuth()
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const result = await login(formData.username, formData.password)
      
      if (result.success) {
        navigate(from)
      } else {
        setError(result.error || '登入失敗，請檢查用戶名稱和密碼')
      }
    } catch (err) {
      setError('登入失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
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

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="username">用戶名稱 / Email</label>
              <input
                id="username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="輸入您的用戶名稱或 Email"
                autoComplete="username"
                className={error ? 'error' : ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">密碼</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="輸入您的密碼"
                autoComplete="current-password"
                className={error ? 'error' : ''}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? '登入中...' : '登入'}
            </button>
          </form>

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
