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
      
      const response = await fetch(`${apiUrl}/update-profile`, {
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
          <div className="profile-header">
            <h1>個人資料</h1>
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
          
          <div className="profile-content">
            {!isEditing ? (
              // 檢視模式
              <div className="profile-view">
                <div className="profile-section">
                  <h2>個人資訊</h2>
                  
                  {/* 頭像顯示 */}
                  <div className="profile-avatar-section">
                    <div className="avatar-container">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.username} className="avatar-image" />
                      ) : (
                        <div className="avatar-placeholder">
                          {user?.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="profile-info">
                    <div className="info-row">
                      <span className="info-label">用戶名稱：</span>
                      <span className="info-value">{user.username}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">電子郵件：</span>
                      <span className="info-value">{user.email}</span>
                    </div>
                    {user.authorName && (
                      <div className="info-row">
                        <span className="info-label">作者名稱：</span>
                        <span className="info-value">{user.authorName}</span>
                      </div>
                    )}
                    {user.bio && (
                      <div className="info-row bio-row">
                        <span className="info-label">自我介紹：</span>
                        <p className="info-value bio-text">{user.bio}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="profile-actions">
                    <Button
                      variant="primary"
                      onClick={() => setIsEditing(true)}
                    >
                      編輯資料
                    </Button>
                  </div>
                </div>
                
                <div className="profile-section">
                  <h2>快速連結</h2>
                  <div className="quick-links">
                    <Link to="/my-artworks" className="link-card">
                      <span className="link-icon">🎨</span>
                      <span>我的作品</span>
                    </Link>
                    <Link to="/submit" className="link-card">
                      <span className="link-icon">📤</span>
                      <span>投稿作品</span>
                    </Link>
                    {user.authorName && (
                      <Link to={`/author/${encodeURIComponent(user.authorName)}`} className="link-card">
                        <span className="link-icon">👤</span>
                        <span>作者頁面</span>
                      </Link>
                    )}
                  </div>
                </div>
                
                <div className="profile-section">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (window.confirm('確定要登出嗎？')) {
                        logout()
                        navigate('/')
                      }
                    }}
                  >
                    登出
                  </Button>
                </div>
              </div>
            ) : (
              // 編輯模式
              <form onSubmit={handleSubmit} className="profile-form">
                <div className="profile-section">
                  <h2>編輯資料</h2>
                  
                  {/* 頭像編輯 */}
                  <div className="avatar-edit-section">
                    <label>頭像</label>
                    <div className="avatar-edit-container">
                      <div className="avatar-preview">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="頭像預覽" />
                        ) : (
                          <div className="avatar-placeholder">
                            {user?.username?.charAt(0).toUpperCase()}
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
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="btn btn-outline btn-sm"
                        >
                          選擇圖片
                        </button>
                        <span className="hint">最大 5MB，建議 200x200px</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="username">用戶名稱</label>
                    <input
                      type="text"
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
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
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="bio">自我介紹</label>
                    <textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows="4"
                      placeholder="介紹一下自己吧..."
                      maxLength="500"
                    />
                    <span className="char-count">{formData.bio.length}/500</span>
                  </div>
                  
                  <div className="form-divider">
                    <span>更改密碼（選填）</span>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="currentPassword">當前密碼</label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                      placeholder="如要更改密碼請填寫"
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
                    />
                  </div>
                  
                  <div className="form-actions">
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
                      variant="primary"
                      disabled={loading}
                    >
                      {loading ? '更新中...' : '儲存變更'}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </Layout>
    </PrivateRoute>
  )
}

export default ProfilePage