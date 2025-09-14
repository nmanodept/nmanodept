// src/pages/admin.jsx
import React, { useState, useEffect, useCallback } from 'react'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import Button from '../components/common/Button'
import Loading from '../components/common/Loading'
import './admin.css'
import { 
  EyeIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  LockClosedIcon,
  PhotoIcon,
  CalendarIcon,
  TagIcon,
  UserIcon,
  PlayIcon,
  LinkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  PlusIcon,
  FolderIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline'

const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [activeTab, setActiveTab] = useState('pending-users')
  const [pendingUsers, setPendingUsers] = useState([])
  const [publishedArtworks, setPublishedArtworks] = useState([])
  const [pendingProfiles, setPendingProfiles] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState({})
  const [expandedItem, setExpandedItem] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  
  // 類別管理狀態
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDescription, setNewCategoryDescription] = useState('')

  // 檢查是否已經登入（使用 sessionStorage）
  useEffect(() => {
    const savedAuth = sessionStorage.getItem('adminAuth')
    if (savedAuth === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  // 載入資料的 useCallback 函數
  const fetchPendingUsers = useCallback(async () => {
    setLoading(true)
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      
      const response = await fetch(`${apiUrl}/admin/pending-users`, {
        method: 'GET',
        headers: {
          'X-Admin-Password': '20241231NOdept',
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPendingUsers(data)
      } else if (response.status === 401) {
        handleLogout()
      }
    } catch (error) {
      console.error('Failed to fetch pending users:', error)
      alert('無法載入待審核用戶，請檢查網路連線或稍後再試')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPublishedArtworks = useCallback(async () => {
    setLoading(true)
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      
      const response = await fetch(`${apiUrl}/admin/approved`, {
        method: 'GET',
        headers: {
          'X-Admin-Password': '20241231NOdept',
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPublishedArtworks(data.artworks || data)
      } else if (response.status === 401) {
        handleLogout()
      }
    } catch (error) {
      console.error('Failed to fetch published artworks:', error)
      alert('無法載入已發布作品，請檢查網路連線或稍後再試')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPendingProfiles = useCallback(async () => {
    setLoading(true)
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      
      const response = await fetch(`${apiUrl}/admin/pending-profiles`, {
        method: 'GET',
        headers: {
          'X-Admin-Password': '20241231NOdept',
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPendingProfiles(data)
      } else if (response.status === 401) {
        handleLogout()
      }
    } catch (error) {
      console.error('Failed to fetch pending profiles:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const response = await fetch(`${apiUrl}/categories`)
      
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 載入資料
  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'pending-users') {
        fetchPendingUsers()
      } else if (activeTab === 'published') {
        fetchPublishedArtworks()
      } else if (activeTab === 'profiles') {
        fetchPendingProfiles()
      } else if (activeTab === 'categories') {
        fetchCategories()
      }
    }
  }, [isAuthenticated, activeTab, refreshKey, fetchPendingUsers, fetchPublishedArtworks, fetchPendingProfiles, fetchCategories])

  // 密碼驗證
  const handleLogin = (e) => {
    e.preventDefault()
    if (password === '20241231NOdept') {
      setIsAuthenticated(true)
      sessionStorage.setItem('adminAuth', 'true')
      setPasswordError('')
      setPassword('')
    } else {
      setPasswordError('密碼錯誤，請重試')
    }
  }

  // 登出
  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('adminAuth')
    setPendingUsers([])
    setPublishedArtworks([])
    setPendingProfiles([])
    setCategories([])
  }

  // 作品管理功能
  const handleApprove = async (id) => {
    setActionLoading(prev => ({ ...prev, [id]: 'approve' }))
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const response = await fetch(`${apiUrl}/admin/approve/${id}`, {
        method: 'PUT',
        headers: {
          'X-Admin-Password': '20241231NOdept',
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        setRefreshKey(prev => prev + 1)
        alert('作品已通過審核！')
      } else {
        alert('操作失敗，請重試')
      }
    } catch (error) {
      console.error('Failed to approve artwork:', error)
      alert('操作失敗，請重試')
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }))
    }
  }

  const handleReject = async (id) => {
    if (!window.confirm('確定要駁回這件作品嗎？')) return
    
    setActionLoading(prev => ({ ...prev, [id]: 'reject' }))
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const response = await fetch(`${apiUrl}/admin/reject/${id}`, {
        method: 'PUT',
        headers: {
          'X-Admin-Password': '20241231NOdept',
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        setRefreshKey(prev => prev + 1)
        alert('作品已駁回')
      } else {
        alert('操作失敗，請重試')
      }
    } catch (error) {
      console.error('Failed to reject artwork:', error)
      alert('操作失敗，請重試')
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }))
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('確定要永久刪除這件作品嗎？此操作無法復原！')) return
    
    setActionLoading(prev => ({ ...prev, [id]: 'delete' }))
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const response = await fetch(`${apiUrl}/admin/delete/${id}`, {
        method: 'DELETE',
        headers: {
          'X-Admin-Password': '20241231NOdept',
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        setRefreshKey(prev => prev + 1)
        alert('作品已刪除')
      } else {
        alert('刪除失敗，請重試')
      }
    } catch (error) {
      console.error('Failed to delete artwork:', error)
      alert('刪除失敗，請重試')
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }))
    }
  }

  const handleRevertToDraft = async (id) => {
    const reason = window.prompt('請輸入退回原因：')
    if (!reason) return
    
    setActionLoading(prev => ({ ...prev, [id]: 'revert' }))
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const response = await fetch(`${apiUrl}/admin/revert-artwork/${id}`, {
        method: 'PUT',
        headers: {
          'X-Admin-Password': '20241231NOdept',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      })
      
      if (response.ok) {
        setRefreshKey(prev => prev + 1)
        alert('作品已退回草稿狀態')
      } else {
        alert('操作失敗，請重試')
      }
    } catch (error) {
      console.error('Failed to revert artwork to draft:', error)
      alert('操作失敗，請重試')
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }))
    }
  }

  // 用戶管理功能
  const handleApproveUser = async (id) => {
    setActionLoading(prev => ({ ...prev, [`user-${id}`]: 'approve' }))
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const response = await fetch(`${apiUrl}/admin/approve-user/${id}`, {
        method: 'PUT',
        headers: {
          'X-Admin-Password': '20241231NOdept',
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        setRefreshKey(prev => prev + 1)
        alert('用戶已通過審核！')
      } else {
        alert('操作失敗，請重試')
      }
    } catch (error) {
      console.error('Failed to approve user:', error)
      alert('操作失敗，請重試')
    } finally {
      setActionLoading(prev => ({ ...prev, [`user-${id}`]: null }))
    }
  }

  const handleRejectUser = async (id) => {
    const reason = window.prompt('請輸入拒絕原因（選填）：')
    if (!window.confirm('確定要拒絕這位用戶嗎？')) return
    
    setActionLoading(prev => ({ ...prev, [`user-${id}`]: 'reject' }))
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const response = await fetch(`${apiUrl}/admin/reject-user/${id}`, {
        method: 'PUT',
        headers: {
          'X-Admin-Password': '20241231NOdept',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: reason || '' })
      })
      
      if (response.ok) {
        setRefreshKey(prev => prev + 1)
        alert('用戶已拒絕')
      } else {
        alert('操作失敗，請重試')
      }
    } catch (error) {
      console.error('Failed to reject user:', error)
      alert('操作失敗，請重試')
    } finally {
      setActionLoading(prev => ({ ...prev, [`user-${id}`]: null }))
    }
  }

  // 作者資料管理
  const handleApproveProfile = async (id) => {
    setActionLoading(prev => ({ ...prev, [`profile-${id}`]: 'approve' }))
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const response = await fetch(`${apiUrl}/admin/approve-profile/${id}`, {
        method: 'PUT',
        headers: {
          'X-Admin-Password': '20241231NOdept',
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        setRefreshKey(prev => prev + 1)
        alert('作者資料已通過審核！')
      } else {
        alert('操作失敗，請重試')
      }
    } catch (error) {
      console.error('Failed to approve profile:', error)
      alert('操作失敗，請重試')
    } finally {
      setActionLoading(prev => ({ ...prev, [`profile-${id}`]: null }))
    }
  }

  const handleRejectProfile = async (id) => {
    if (!window.confirm('確定要駁回這份作者資料嗎？')) return
    
    setActionLoading(prev => ({ ...prev, [`profile-${id}`]: 'reject' }))
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const response = await fetch(`${apiUrl}/admin/reject-profile/${id}`, {
        method: 'PUT',
        headers: {
          'X-Admin-Password': '20241231NOdept',
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        setRefreshKey(prev => prev + 1)
        alert('作者資料已駁回')
      } else {
        alert('操作失敗，請重試')
      }
    } catch (error) {
      console.error('Failed to reject profile:', error)
      alert('操作失敗，請重試')
    } finally {
      setActionLoading(prev => ({ ...prev, [`profile-${id}`]: null }))
    }
  }

  // 類別管理
  const handleCreateCategory = async (e) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return
    
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const response = await fetch(`${apiUrl}/admin/categories`, {
        method: 'POST',
        headers: {
          'X-Admin-Password': '20241231NOdept',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newCategoryName,
          description: newCategoryDescription
        })
      })
      
      if (response.ok) {
        setNewCategoryName('')
        setNewCategoryDescription('')
        setShowAddCategory(false)
        setRefreshKey(prev => prev + 1)
        alert('類別已創建')
      } else {
        const error = await response.json()
        alert(error.error || '創建失敗')
      }
    } catch (error) {
      console.error('Failed to create category:', error)
      alert('創建失敗，請重試')
    }
  }

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('確定要刪除這個類別嗎？')) return
    
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const response = await fetch(`${apiUrl}/admin/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'X-Admin-Password': '20241231NOdept',
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        setRefreshKey(prev => prev + 1)
        alert('類別已刪除')
      } else {
        alert('刪除失敗，請重試')
      }
    } catch (error) {
      console.error('Failed to delete category:', error)
      alert('刪除失敗，請重試')
    }
  }

  // 切換展開/收合
  const toggleExpand = (id) => {
    setExpandedItem(expandedItem === id ? null : id)
  }

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '未知'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  // 渲染作品卡片
  const renderArtworkCard = (artwork, isPending = true) => (
    <div key={artwork.id} className="artwork-card">
      <div className="artwork-card-body">
        <div className="artwork-card-content">
          <div className="artwork-image-wrapper">
            {artwork.main_image_url ? (
              <img 
                src={artwork.main_image_url} 
                alt={artwork.title}
                className="artwork-image"
              />
            ) : (
              <div className="artwork-image-placeholder">
                <PhotoIcon className="w-12 h-12" />
              </div>
            )}
          </div>
          
          <div className="artwork-info">
            <h3 className="artwork-title">
              {artwork.title}
            </h3>
            
            <div className="artwork-meta">
              <div className="meta-item">
                <UserIcon className="meta-icon" />
                <span>作者：{artwork.authors?.join(', ') || artwork.author}</span>
              </div>
              <div className="meta-item">
                <CalendarIcon className="meta-icon" />
                <span>創作年份：{artwork.project_year}</span>
              </div>
              <div className="meta-item">
                <FolderIcon className="meta-icon" />
                <span>類別：{artwork.category_name || '未分類'}</span>
              </div>
              <div className="meta-item">
                <CalendarIcon className="meta-icon" />
                <span>{isPending ? '提交' : '審核'}時間：{formatDate(isPending ? artwork.created_at : artwork.updated_at)}</span>
              </div>
            </div>
            
            {artwork.tags && artwork.tags.length > 0 && (
              <div className="artwork-tags">
                {artwork.tags.map((tag, index) => (
                  <span key={index} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            <div className="artwork-actions">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => toggleExpand(artwork.id)}
              >
                <EyeIcon className="w-4 h-4 mr-1" />
                {expandedItem === artwork.id ? '收合' : '預覽'}
                {expandedItem === artwork.id ? (
                  <ChevronUpIcon className="w-4 h-4 ml-1" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4 ml-1" />
                )}
              </Button>
              
              <div className="button-group">
                {isPending ? (
                  <>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleApprove(artwork.id)}
                      disabled={actionLoading[artwork.id] !== undefined}
                      loading={actionLoading[artwork.id] === 'approve'}
                    >
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      通過
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleReject(artwork.id)}
                      disabled={actionLoading[artwork.id] !== undefined}
                      loading={actionLoading[artwork.id] === 'reject'}
                    >
                      <XCircleIcon className="w-4 h-4 mr-1" />
                      駁回
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRevertToDraft(artwork.id)}
                      disabled={actionLoading[artwork.id] !== undefined}
                      loading={actionLoading[artwork.id] === 'revert'}
                    >
                      <ArrowUturnLeftIcon className="w-4 h-4 mr-1" />
                      退回草稿
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDelete(artwork.id)}
                      disabled={actionLoading[artwork.id] !== undefined}
                      loading={actionLoading[artwork.id] === 'delete'}
                    >
                      <TrashIcon className="w-4 h-4 mr-1" />
                      刪除
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {expandedItem === artwork.id && (
        <div className="artwork-expanded">
          <div className="expanded-section">
            <div className="section-label">
              <TagIcon className="w-4 h-4" />
              作品簡介
            </div>
            <p className="section-content">{artwork.description}</p>
          </div>
          
          {artwork.video_url && (
            <div className="expanded-section">
              <div className="section-label">
                <PlayIcon className="w-4 h-4" />
                作品紀錄影片
              </div>
              <a 
                href={artwork.video_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="section-content link"
              >
                {artwork.video_url}
              </a>
            </div>
          )}
          
          {(artwork.social_links && artwork.social_links.length > 0) || artwork.social_link ? (
            <div className="expanded-section">
              <div className="section-label">
                <LinkIcon className="w-4 h-4" />
                社群連結
              </div>
              {artwork.social_links && artwork.social_links.length > 0 ? (
                <div className="section-content">
                  {artwork.social_links.map((link, index) => (
                    <a 
                      key={index}
                      href={link.includes('http') ? link : `https://${link}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="link block"
                    >
                      {link}
                    </a>
                  ))}
                </div>
              ) : artwork.social_link ? (
                <a 
                  href={artwork.social_link.includes('http') ? artwork.social_link : `https://${artwork.social_link}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="section-content link"
                >
                  {artwork.social_link}
                </a>
              ) : null}
            </div>
          ) : null}
          
          {artwork.gallery_images && artwork.gallery_images.length > 0 && (
            <div className="expanded-section">
              <div className="section-label">
                <PhotoIcon className="w-4 h-4" />
                其他展示圖片
              </div>
              <div className="gallery-grid">
                {artwork.gallery_images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Gallery ${index + 1}`}
                    className="gallery-thumbnail"
                  />
                ))}
              </div>
            </div>
          )}
          
          {artwork.gallery_videos && artwork.gallery_videos.length > 0 && (
            <div className="expanded-section">
              <div className="section-label">
                <PlayIcon className="w-4 h-4" />
                其他影片連結
              </div>
              <div className="section-content">
                {artwork.gallery_videos.map((video, index) => (
                  <a 
                    key={index}
                    href={video} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="link block"
                  >
                    影片 {index + 1}: {video}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )

  // 渲染作者資料卡片
  const renderProfileCard = (profile) => (
    <div key={profile.id} className="profile-card">
      <div className="profile-content">
        <div className="profile-avatar">
          {profile.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt={profile.author_name}
              className="avatar-image"
            />
          ) : (
            <div className="avatar-placeholder">
              <UserCircleIcon className="w-6 h-6" />
            </div>
          )}
        </div>
        
        <div className="profile-info">
          <h3 className="profile-name">
            {profile.author_name}
          </h3>
          
          <div className="meta-item">
            <CalendarIcon className="meta-icon" />
            <span>提交時間：{formatDate(profile.created_at)}</span>
          </div>
          
          <p className="profile-bio">
            {profile.bio}
          </p>
          
          {profile.social_links && profile.social_links.length > 0 && (
            <div className="profile-links">
              {profile.social_links.map((link, index) => (
                <a
                  key={index}
                  href={link.includes('http') ? link : `https://${link}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="profile-link"
                >
                  <LinkIcon className="w-4 h-4 mr-1 inline-block" />
                  連結 {index + 1}
                </a>
              ))}
            </div>
          )}
          
          <div className="artwork-actions">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleApproveProfile(profile.id)}
              disabled={actionLoading[`profile-${profile.id}`] !== undefined}
              loading={actionLoading[`profile-${profile.id}`] === 'approve'}
            >
              <CheckCircleIcon className="w-4 h-4 mr-1" />
              通過
            </Button>
            
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleRejectProfile(profile.id)}
              disabled={actionLoading[`profile-${profile.id}`] !== undefined}
              loading={actionLoading[`profile-${profile.id}`] === 'reject'}
            >
              <XCircleIcon className="w-4 h-4 mr-1" />
              駁回
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  // 渲染用戶卡片
  const renderUserCard = (user) => (
    <div key={user.id} className="profile-card">
      <div className="profile-content">
        <div className="profile-avatar">
          <div className="avatar-placeholder">
            <UserCircleIcon className="w-6 h-6" />
          </div>
        </div>
        
        <div className="profile-info">
          <h3 className="profile-name">
            {user.username}
          </h3>
          
          <div className="meta-item">
            <span>Email：{user.email}</span>
          </div>
          
          {user.authorName && (
            <div className="meta-item">
              <span>關聯作者：{user.authorName}</span>
            </div>
          )}
          
          <div className="meta-item">
            <CalendarIcon className="meta-icon" />
            <span>註冊時間：{formatDate(user.created_at)}</span>
          </div>
          
          <div className="artwork-actions">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleApproveUser(user.id)}
              disabled={actionLoading[`user-${user.id}`] !== undefined}
              loading={actionLoading[`user-${user.id}`] === 'approve'}
            >
              <CheckCircleIcon className="w-4 h-4 mr-1" />
              通過
            </Button>
            
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleRejectUser(user.id)}
              disabled={actionLoading[`user-${user.id}`] !== undefined}
              loading={actionLoading[`user-${user.id}`] === 'reject'}
            >
              <XCircleIcon className="w-4 h-4 mr-1" />
              拒絕
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  // 未登入狀態
  if (!isAuthenticated) {
    return (
      <Layout>
        <Seo title="管理員登入" />
        
        <div className="admin-login-container">
          <div className="login-card">
            <div className="login-header">
              <div className="login-icon-wrapper">
                <LockClosedIcon className="login-icon" />
              </div>
              <h1 className="login-title">管理員登入</h1>
              <p className="login-subtitle">請輸入管理員密碼</p>
            </div>
            
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  密碼
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setPasswordError('')
                  }}
                  className={`login-input ${passwordError ? 'error' : ''}`}
                  placeholder="輸入管理員密碼"
                />
                {passwordError && (
                  <p className="login-error">{passwordError}</p>
                )}
              </div>
              
              <Button type="submit" fullWidth size="lg">
                登入
              </Button>
            </form>
          </div>
        </div>
      </Layout>
    )
  }

  // 已登入狀態
  return (
    <Layout>
      <Seo title="管理員後台" />
      
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1 className="admin-title">管理員後台</h1>
            <p className="admin-subtitle">管理所有內容</p>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            登出
          </Button>
        </div>
        
        <div className="admin-tabs">
          <button
            onClick={() => setActiveTab('pending-users')}
            className={`tab-button ${activeTab === 'pending-users' ? 'active' : ''}`}
          >
            待審核用戶
            <span className="tab-count">({pendingUsers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('published')}
            className={`tab-button ${activeTab === 'published' ? 'active' : ''}`}
          >
            已發布作品
            <span className="tab-count">({Array.isArray(publishedArtworks) ? publishedArtworks.length : 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('profiles')}
            className={`tab-button ${activeTab === 'profiles' ? 'active' : ''}`}
          >
            待審核作者資料
            <span className="tab-count">({pendingProfiles.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`tab-button ${activeTab === 'categories' ? 'active' : ''}`}
          >
            類別管理
            <span className="tab-count">({categories.length})</span>
          </button>
        </div>
        
        {loading ? (
          <div className="loading-container">
            <Loading type="spinner" size="lg" text="載入中..." />
          </div>
        ) : (
          <div>
            {activeTab === 'pending-users' && (
              <div className="users-list">
                {pendingUsers.length === 0 ? (
                  <div className="empty-state">
                    <UserCircleIcon className="empty-icon" />
                    <p className="empty-text">目前沒有待審核的用戶</p>
                  </div>
                ) : (
                  pendingUsers.map(user => renderUserCard(user))
                )}
              </div>
            )}

            {activeTab === 'published' && (
              <div className="artworks-list">
                {!Array.isArray(publishedArtworks) || publishedArtworks.length === 0 ? (
                  <div className="empty-state">
                    <p className="empty-text">目前沒有已發布的作品</p>
                  </div>
                ) : (
                  publishedArtworks.map(artwork => renderArtworkCard(artwork, false))
                )}
              </div>
            )}
            
            {activeTab === 'profiles' && (
              <div className="profiles-list">
                {pendingProfiles.length === 0 ? (
                  <div className="empty-state">
                    <UserCircleIcon className="empty-icon" />
                    <p className="empty-text">目前沒有待審核的作者資料</p>
                  </div>
                ) : (
                  pendingProfiles.map(profile => renderProfileCard(profile))
                )}
              </div>
            )}
            
            {activeTab === 'categories' && (
              <div className="categories-section">
                <div className="category-actions">
                  <Button
                    onClick={() => setShowAddCategory(!showAddCategory)}
                    size="sm"
                  >
                    <PlusIcon className="w-4 h-4 mr-1" />
                    新增類別
                  </Button>
                </div>
                
                {showAddCategory && (
                  <form onSubmit={handleCreateCategory} className="category-add-form">
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">
                          類別名稱 <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="form-input"
                          placeholder="例如：數位藝術"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">
                          類別說明
                        </label>
                        <input
                          type="text"
                          value={newCategoryDescription}
                          onChange={(e) => setNewCategoryDescription(e.target.value)}
                          className="form-input"
                          placeholder="選填"
                        />
                      </div>
                    </div>
                    <div className="form-actions">
                      <Button type="submit" size="sm">
                        創建
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowAddCategory(false)
                          setNewCategoryName('')
                          setNewCategoryDescription('')
                        }}
                      >
                        取消
                      </Button>
                    </div>
                  </form>
                )}
                
                <div className="categories-list">
                  {categories.length === 0 ? (
                    <div className="empty-state">
                      <FolderIcon className="empty-icon" />
                      <p className="empty-text">尚未建立任何類別</p>
                    </div>
                  ) : (
                    categories.map(category => (
                      <div key={category.id} className="category-item">
                        <div className="category-info">
                          <h4>{category.name}</h4>
                          {category.description && (
                            <p>{category.description}</p>
                          )}
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default AdminPage