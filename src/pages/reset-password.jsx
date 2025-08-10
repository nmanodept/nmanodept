// ========== /src/pages/reset-password.jsx ==========
import React, { useState, useEffect } from 'react'
import { Link, navigate } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import './auth.css'

const ResetPasswordPage = ({ location }) => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [token, setToken] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const resetToken = params.get('token')
    if (!resetToken) {
      navigate('/forgot-password')
    }
    setToken(resetToken)
  }, [location])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('密碼不一致')
      return
    }

    if (password.length < 8) {
      setError('密碼至少需要8個字符')
      return
    }

    setIsSubmitting(true)

    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const response = await fetch(`${apiUrl}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, password })
      })

      const data = await response.json()

      if (response.ok) {
        alert('密碼已成功重設，請使用新密碼登入')
        navigate('/login')
      } else {
        setError(data.error || '重設失敗，請稍後再試')
      }
    } catch (error) {
      setError('重設失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Layout>
      <Seo title="重設密碼" />
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">重設密碼</h1>
          <p className="auth-subtitle">請輸入您的新密碼</p>
          
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="password">新密碼</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength="8"
                placeholder="至少8個字符"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">確認新密碼</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="再次輸入新密碼"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? '重設中...' : '重設密碼'}
            </button>
          </form>

          <div className="auth-footer">
            <p><Link to="/login">返回登入</Link></p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default ResetPasswordPage