// ========== /src/pages/profile.jsx ==========
import React, { useState } from 'react'
import { Link } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import PrivateRoute from '../components/auth/PrivateRoute'
import { useAuth } from '../components/auth/AuthContext'
import './profile.css'

const ProfilePage = () => {
  const { user, updateProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    // 如果要更改密碼，驗證新密碼
    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        setError('新密碼不一致')
        return
      }
      if (formData.newPassword.length < 8) {
        setError('密碼至少需要8個字符')
        return
      }
      if (!formData.currentPassword) {
        setError('請輸入當前密碼')
        return
      }
    }

    setIsSubmitting(true)

    try {
      const updateData = {
        email: formData.email
      }
      
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword
        updateData.newPassword = formData.newPassword
      }

      const result = await updateProfile(updateData)
      
      if (result.success) {
        setMessage('個人資料已更新')
        setIsEditing(false)
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        setError(result.error || '更新失敗')
      }
    } catch (err) {
      setError('更新失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PrivateRoute>
      <Layout>
        <Seo title="個人資料" />
        <div className="profile-container">
          <div className="profile-header">
            <h1>個人資料</h1>
            <div className="profile-nav">
              <Link to="/my-artworks" className="nav-link">
                我的作品
              </Link>
              <Link to="/submit" className="nav-link">
                投稿作品
              </Link>
            </div>
          </div>

          <div className="profile-content">
            <div className="profile-card">
              <div className="profile-card-header">
                <h2>基本資訊</h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn btn-outline"
                  >
                    編輯資料
                  </button>
                )}
              </div>

              {message && (
                <div className="alert alert-success">
                  {message}
                </div>
              )}

              {error && (
                <div className="alert alert-error">
                  {error}
                </div>
              )}

              {!isEditing ? (
                <div className="profile-info">
                  <div className="info-row">
                    <span className="label">用戶名稱：</span>
                    <span className="value">{user?.username}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Email：</span>
                    <span className="value">{user?.email}</span>
                  </div>
                  {user?.authorName && (
                    <div className="info-row">
                      <span className="label">關聯作者：</span>
                      <span className="value">{user.authorName}</span>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="profile-form">
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-section">
                    <h3>更改密碼（選填）</h3>
                    
                    <div className="form-group">
                      <label htmlFor="currentPassword">當前密碼</label>
                      <input
                        id="currentPassword"
                        type="password"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        placeholder="如要更改密碼請輸入"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="newPassword">新密碼</label>
                      <input
                        id="newPassword"
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        placeholder="至少8個字符"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="confirmPassword">確認新密碼</label>
                      <input
                        id="confirmPassword"
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="再次輸入新密碼"
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? '儲存中...' : '儲存變更'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => {
                        setIsEditing(false)
                        setError('')
                        setFormData({
                          email: user?.email || '',
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        })
                      }}
                    >
                      取消
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </PrivateRoute>
  )
}

export default ProfilePage
