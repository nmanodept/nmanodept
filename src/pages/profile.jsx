//Location: /src/pages/profile.jsx
import React, { useState } from 'react'
import { Link } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import PrivateRoute from '../components/auth/PrivateRoute'
import Button from '../components/common/Button'
import { useAuth } from '../components/auth/AuthContext'
import './profile.css'

const ProfilePage = () => {
  const { user, updateProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [email, setEmail] = useState(user?.email || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (newPassword && newPassword !== confirmPassword) {
      setError('新密碼不一致')
      return
    }

    if (newPassword && newPassword.length < 8) {
      setError('密碼至少需要8個字符')
      return
    }

    setIsSubmitting(true)

    try {
      const profileData = { email }
      if (newPassword) {
        profileData.currentPassword = currentPassword
        profileData.newPassword = newPassword
      }

      const result = await updateProfile(profileData)
      
      if (result.success) {
        setMessage('個人資料已更新')
        setIsEditing(false)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setError(result.error)
      }
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
            </div>
          </div>

          <div className="profile-content">
            <div className="profile-card">
              <h2>基本資訊</h2>
              
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
                  <Button onClick={() => setIsEditing(true)} variant="secondary">
                    編輯資料
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="profile-form">
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="如要更改密碼請輸入"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="newPassword">新密碼</label>
                      <input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
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
                        placeholder="再次輸入新密碼"
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? '儲存中...' : '儲存變更'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false)
                        setError('')
                        setCurrentPassword('')
                        setNewPassword('')
                        setConfirmPassword('')
                      }}
                    >
                      取消
                    </Button>
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