// ========== /src/pages/profile.jsx - 完整修復版 ==========
import React, { useState, useEffect, useRef } from 'react'
import { Link, navigate } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import Button from '../components/common/Button'
import { useAuth } from '../components/auth/AuthContext'
import PrivateRoute from '../components/auth/PrivateRoute'
import './profile.css'

const ProfilePage = () => {
  const { user, logout, updateUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  
  // 表單資料
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    authorName: '',
    bio: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  // 頭像相關
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const fileInputRef = useRef(null)
  
  // 載入用戶資料
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        username: user.username || '',
        email: user.email || '',
        authorName: user.authorName || '',
        bio: user.bio || ''
      }))
      setAvatarPreview(user.avatarUrl || '')
    }
  }, [user])
  
  // 處理頭像上傳
  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('圖片大小不能超過 5MB')
        return
      }
      
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }
  
  // 處理表單提交
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')
    
    // 驗證密碼確認
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError('新密碼與確認密碼不符')
      setLoading(false)
      return
    }
    
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const token = localStorage.getItem('authToken')
      
      // 如果有新頭像，先上傳
      let newAvatarUrl = user?.avatarUrl || ''
      if (avatarFile) {
        const uploadFormData = new FormData()
        uploadFormData.append('avatar', avatarFile)
        
        const uploadResponse = await fetch(`${apiUrl}/auth/upload-avatar`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: uploadFormData
        })
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          newAvatarUrl = uploadData.avatarUrl
        }
      }
      
      const updateData = {
        username: formData.username,
        email: formData.email,
        authorName: formData.authorName,
        bio: formData.bio,
        avatarUrl: newAvatarUrl
      }
      
      // 只有在要更改密碼時才發送密碼資料
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword
        updateData.newPassword = formData.newPassword
      }
      
      // 修復：使用正確的 API 路徑
      const response = await fetch(`${apiUrl}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setMessage('資料更新成功！')
        setIsEditing(false)
        
        // 清除密碼欄位和頭像檔案
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }))
        setAvatarFile(null)
        
        // 更新本地用戶資料
        if (data.user) {
          updateUser(data.user)
        }
      } else {
        setError(data.error || '更新失敗')
      }
    } catch (error) {
      console.error('Update error:', error)
      setError('更新時發生錯誤，請稍後再試')
    } finally {
      setLoading(false)
    }
  }
  
  // 取消編輯
  const handleCancel = () => {
    setIsEditing(false)
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
      authorName: user?.authorName || '',
      bio: user?.bio || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    setAvatarPreview(user?.avatarUrl || '')
    setAvatarFile(null)
    setError('')
    setMessage('')
  }
  
  if (!user) {
    return (
      <Layout>
        <Seo title="個人資料" />
        <div className="profile-container">
          <div className="auth-required">
            <h2>請先登入</h2>
            <Link to="/login" className="btn btn-primary">
              前往登入
            </Link>
          </div>
        </div>
      </Layout>
    )
  }
  
  return (
    <PrivateRoute>
      <Layout>
        <Seo title="個人資料" />
        <div className="profile-container">
          {/* 頁面標題 */}
          <div className="profile-header">
            <h1 className="profile-title">個人資料</h1>
            <p className="profile-subtitle">管理您的個人資訊和帳戶設定</p>
          </div>
          
          {/* 成功/錯誤訊息 */}
          {message && (
            <div className="alert alert-success">
              <div className="alert-icon">✓</div>
              <div>
                <p className="alert-title">更新成功！</p>
                <p className="alert-message">{message}</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="alert alert-error">
              <div className="alert-icon">!</div>
              <div>
                <p className="alert-title">更新失敗</p>
                <p className="alert-message">{error}</p>
              </div>
            </div>
          )}
          
          <div className="profile-content">
            {!isEditing ? (
              // 檢視模式 - 全新現代化設計
              <div className="profile-view">
                {/* 個人資訊卡片 */}
                <div className="profile-card profile-main-card">
                  <div className="card-header">
                    <h2 className="card-title">個人資訊</h2>
                    <Button
                      variant="primary"
                      onClick={() => setIsEditing(true)}
                      className="edit-btn"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M11.5 1.5a2.121 2.121 0 013 3L5 14l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      編輯資料
                    </Button>
                  </div>
                  
                  <div className="profile-main-content">
                    {/* 頭像區域 */}
                    <div className="profile-avatar-section">
                      <div className="avatar-wrapper">
                        {user?.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.username} className="avatar-image" />
                        ) : (
                          <div className="avatar-placeholder">
                            <span className="avatar-initial">
                              {user?.username?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="avatar-ring"></div>
                      </div>
                    </div>
                    
                    {/* 個人資訊 */}
                    <div className="profile-info-section">
                      <div className="info-grid">
                        <div className="info-item">
                          <span className="info-label">用戶名稱</span>
                          <span className="info-value">{user.username}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">電子郵件</span>
                          <span className="info-value">{user.email}</span>
                        </div>
                        {user.authorName && (
                          <div className="info-item">
                            <span className="info-label">作者名稱</span>
                            <span className="info-value">{user.authorName}</span>
                          </div>
                        )}
                      </div>
                      
                      {user.bio && (
                        <div className="bio-section">
                          <span className="info-label">自我介紹</span>
                          <p className="bio-text">{user.bio}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* 快速連結卡片 */}
                <div className="profile-card quick-actions-card">
                  <div className="card-header">
                    <h2 className="card-title">快速操作</h2>
                  </div>
                  
                  <div className="quick-actions-grid">
                    <Link to="/my-artworks" className="action-card">
                      <div className="action-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                          <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                          <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                          <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </div>
                      <div className="action-content">
                        <h3>我的作品</h3>
                        <p>查看和管理您的作品集</p>
                      </div>
                      <div className="action-arrow">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M6 4L10 8L6 12"/>
                        </svg>
                      </div>
                    </Link>
                    
                    <Link to="/submit" className="action-card">
                      <div className="action-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/>
                          <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
                          <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/>
                          <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/>
                          <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </div>
                      <div className="action-content">
                        <h3>投稿作品</h3>
                        <p>上傳新的作品到平台</p>
                      </div>
                      <div className="action-arrow">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M6 4L10 8L6 12"/>
                        </svg>
                      </div>
                    </Link>
                    
                    {user.authorName && (
                      <Link to={`/author/${encodeURIComponent(user.authorName)}`} className="action-card">
                        <div className="action-icon">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                            <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        </div>
                        <div className="action-content">
                          <h3>作者頁面</h3>
                          <p>查看您的公開作者頁面</p>
                        </div>
                        <div className="action-arrow">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M6 4L10 8L6 12"/>
                          </svg>
                        </div>
                      </Link>
                    )}
                  </div>
                </div>
                
                {/* 帳戶操作卡片 */}
                <div className="profile-card account-actions-card">
                  <div className="card-header">
                    <h2 className="card-title">帳戶操作</h2>
                  </div>
                  
                  <div className="account-actions">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (window.confirm('確定要登出嗎？')) {
                          logout()
                          navigate('/')
                        }
                      }}
                      className="logout-btn"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M6 12l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12a9 9 0 1 1 18 0 9 9 0 0 1-18 0z"/>
                      </svg>
                      登出帳戶
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              // 編輯模式 - 現代化表單設計
              <div className="profile-edit-mode">
                <form onSubmit={handleSubmit} className="profile-form">
                  {/* 編輯表單卡片 */}
                  <div className="profile-card edit-form-card">
                    <div className="card-header">
                      <h2 className="card-title">編輯資料</h2>
                      <div className="form-actions-header">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancel}
                          disabled={loading}
                        >
                          取消
                        </Button>
                        <Button
                          type="submit"
                          variant="outline"
                          disabled={loading}
                        >
                          {loading ? '更新中...' : '儲存變更'}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="form-content">
                      {/* 頭像編輯區域 */}
                      <div className="form-section avatar-section">
                        <label className="section-label">頭像</label>
                        <div className="avatar-edit-container">
                          <div className="avatar-preview-large">
                            {avatarPreview ? (
                              <img src={avatarPreview} alt="頭像預覽" />
                            ) : (
                              <div className="avatar-placeholder">
                                <span className="avatar-initial">
                                  {user?.username?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="avatar-controls">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarChange}
                              style={{ display: 'none' }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                              className="upload-btn"
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M8.5 2a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L8 8.293V2.5a.5.5 0 0 1 .5-.5z"/>
                                <path d="M2 12.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/>
                              </svg>
                              選擇圖片
                            </Button>
                            <p className="upload-hint">最大 5MB，建議 200x200px</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* 基本資訊區域 */}
                      <div className="form-section basic-info-section">
                        <label className="section-label">基本資訊</label>
                        <div className="form-grid">
                          <div className="form-group">
                            <label htmlFor="username">用戶名稱</label>
                            <input
                              type="text"
                              id="username"
                              value={formData.username}
                              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                              required
                              className="form-input"
                            />
                          </div>
                          
                          <div className="form-group">
                            <label htmlFor="email">電子郵件</label>
                            <input
                              type="email"
                              id="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              required
                              className="form-input"
                            />
                          </div>
                          
                          <div className="form-group">
                            <label htmlFor="authorName">作者名稱（本名）</label>
                            <input
                              type="text"
                              id="authorName"
                              value={formData.authorName}
                              onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                              placeholder="請輸入您的本名"
                              className="form-input"
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* 自我介紹區域 */}
                      <div className="form-section bio-section">
                        <label className="section-label">自我介紹</label>
                        <div className="form-group">
                          <textarea
                            id="bio"
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            rows="4"
                            placeholder="介紹一下自己吧..."
                            maxLength="500"
                            className="form-textarea"
                          />
                          <div className="form-footer">
                            <span className="char-count">{formData.bio.length}/500</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* 密碼更改區域 */}
                      <div className="form-section password-section">
                        <div className="section-divider">
                          <span className="divider-text">更改密碼（選填）</span>
                        </div>
                        
                        <div className="form-grid">
                          <div className="form-group">
                            <label htmlFor="currentPassword">當前密碼</label>
                            <input
                              type="password"
                              id="currentPassword"
                              value={formData.currentPassword}
                              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                              placeholder="如要更改密碼請填寫"
                              className="form-input"
                            />
                          </div>
                          
                          <div className="form-group">
                            <label htmlFor="newPassword">新密碼</label>
                            <input
                              type="password"
                              id="newPassword"
                              value={formData.newPassword}
                              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                              placeholder="留空表示不更改"
                              minLength="6"
                              className="form-input"
                            />
                          </div>
                          
                          <div className="form-group">
                            <label htmlFor="confirmPassword">確認新密碼</label>
                            <input
                              type="password"
                              id="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                              placeholder="再次輸入新密碼"
                              className="form-input"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </PrivateRoute>
  )
}

export default ProfilePage