//Location: /src/pages/forgot-password.jsx
import React, { useState } from 'react'
import { Link } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import Button from '../components/common/Button'
import './auth.css'

const ForgotPasswordPage = () => {
  const [authorName, setAuthorName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const response = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ authorName })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        setError(data.error || '發送失敗，請稍後再試')
      }
    } catch (error) {
      setError('發送失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <Layout>
        <Seo title="重設密碼郵件已發送" />
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-success">
              <h2>郵件已發送</h2>
              <p>如果該作者有註冊帳號，重設密碼連結已發送到註冊信箱。</p>
              <p>請檢查您的電子郵件並按照指示重設密碼。</p>
              <Link to="/login" className="btn btn-primary">
                返回登入
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Seo title="忘記密碼" />
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">忘記密碼</h1>
          <p className="auth-subtitle">輸入您的作者名稱，我們將發送重設密碼連結到您的註冊信箱</p>
          
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="authorName">作者名稱</label>
              <input
                id="authorName"
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                required
                placeholder="輸入您的作者名稱"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={isSubmitting}
            >
              {isSubmitting ? '發送中...' : '發送重設連結'}
            </Button>
          </form>

          <div className="auth-footer">
            <p><Link to="/login">返回登入</Link></p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default ForgotPasswordPage