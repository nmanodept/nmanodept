// ========== /src/pages/register.jsx ==========
import React, { useState, useEffect } from 'react'
import { Link, navigate } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import { useAuth } from '../components/auth/AuthContext'
import './auth.css'

const RegisterPage = () => {
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    authorName: '',
    securityAnswer: ''
  })
  const [availableAuthors, setAvailableAuthors] = useState([])
  const [showAuthorSelect, setShowAuthorSelect] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchAuthors()
  }, [])

  const fetchAuthors = async () => {
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const response = await fetch(`${apiUrl}/authors`)
      if (response.ok) {
        const data = await response.json()
        // 只顯示還沒有關聯帳號的作者
        const unlinkedAuthors = data.filter(author => !author.user_id)
        setAvailableAuthors(unlinkedAuthors)
      }
    } catch (error) {
      console.error('Failed to fetch authors:', error)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // 驗證密碼
    if (formData.password !== formData.confirmPassword) {
      setError('密碼不一致')
      return
    }

    if (formData.password.length < 8) {
      setError('密碼至少需要8個字符')
      return
    }

    // 驗證安全問題
    const answer = formData.securityAnswer.toLowerCase().trim()
    if (answer !== '小明' && answer !== '小民') {
      setError('安全問題答案錯誤')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        authorName: formData.authorName || null
      })
      
      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error || '註冊失敗')
      }
    } catch (err) {
      setError('註冊失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <Layout>
        <Seo title="註冊成功" />
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-success-content">
              <h2>註冊成功！</h2>
              <p>您的帳號已建立，正在等待管理員審核。</p>
              <p>審核通過後，您將收到通知郵件。</p>
              <Link to="/" className="btn btn-primary">
                返回首頁
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Seo title="註冊帳號" />
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">註冊帳號</h1>
          <p className="auth-subtitle">加入新沒系館，分享您的創作</p>
          
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="username">用戶名稱 *</label>
              <input
                id="username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                pattern="[a-zA-Z0-9_]+"
                minLength="3"
                placeholder="例如：nma_chan"
              />
              <span className="form-hint">只能使用英文、數字和底線</span>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="nma_chan@email.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">密碼 *</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="8"
                placeholder="至少8個字符"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">確認密碼 *</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="再次輸入密碼"
              />
            </div>

            <div className="form-group">
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="hasAuthor"
                  checked={showAuthorSelect}
                  onChange={(e) => setShowAuthorSelect(e.target.checked)}
                />
                <label htmlFor="hasAuthor">
                  我是現有作者（已有作品在平台上）
                </label>
              </div>
              
              {showAuthorSelect && (
                <select
                  name="authorName"
                  value={formData.authorName}
                  onChange={handleChange}
                >
                  <option value="">選擇您的作者名稱</option>
                  {availableAuthors.map(author => (
                    <option key={author.id} value={author.name}>
                      {author.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-group security-question">
              <label htmlFor="securityAnswer">
                必答題：你借器材都找誰？ *
                <span className="hint">（提示：小X）</span>
              </label>
              <input
                id="securityAnswer"
                type="text"
                name="securityAnswer"
                value={formData.securityAnswer}
                onChange={handleChange}
                required
                placeholder="請輸入答案"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? '註冊中...' : '註冊'}
            </button>
          </form>

          <div className="auth-footer">
            <p>已經有帳號了？<Link to="/login">立即登入</Link></p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default RegisterPage