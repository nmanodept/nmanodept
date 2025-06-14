//Location: /src/pages/admin.jsx
import React, { useState, useEffect, useCallback } from 'react'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import Button from '../components/common/Button'
import Loading from '../components/common/Loading'
import './admin.css'
import { 
  LockClosedIcon,
  UserCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  EnvelopeIcon,
  UserIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'

const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [activeTab, setActiveTab] = useState('pending-users')
  const [pendingUsers, setPendingUsers] = useState([])
  const [approvedArtworks, setApprovedArtworks] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState({})
  const [expandedItem, setExpandedItem] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // 檢查是否已經登入
  useEffect(() => {
    const savedAuth = sessionStorage.getItem('adminAuth')
    if (savedAuth === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  // 載入待審核用戶
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

  // 載入已發布的作品（用於管理）
  const fetchApprovedArtworks = useCallback(async () => {
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
        setApprovedArtworks(data)
      } else if (response.status === 401) {
        handleLogout()
      }
    } catch (error) {
      console.error('Failed to fetch approved artworks:', error)
      alert('無法載入已審核作品，請檢查網路連線或稍後再試')
    } finally {
      setLoading(false)
    }
  }, [])

  // 載入資料
  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'pending-users') {
        fetchPendingUsers()
      } else if (activeTab === 'artworks') {
        fetchApprovedArtworks()
      }
    }
  }, [isAuthenticated, activeTab, refreshKey, fetchPendingUsers, fetchApprovedArtworks])

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
    setApprovedArtworks([])
  }

  // 用戶審核功能
  const handleApproveUser = async (userId) => {
    setActionLoading(prev => ({ ...prev, [`user-${userId}`]: 'approve' }))
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const response = await fetch(`${apiUrl}/admin/approve-user/${userId}`, {
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
      setActionLoading(prev => ({ ...prev, [`user-${userId}`]: null }))
    }
  }

  const handleRejectUser = async (userId) => {
    const reason = window.prompt('請輸入拒絕原因（選填）：')
    if (reason === null) return // 用戶取消
    
    setActionLoading(prev => ({ ...prev, [`user-${userId}`]: 'reject' }))
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const response = await fetch(`${apiUrl}/admin/reject-user/${userId}`, {
        method: 'PUT',
        headers: {
          'X-Admin-Password': '20241231NOdept',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
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
      setActionLoading(prev => ({ ...prev, [`user-${userId}`]: null }))
    }
  }

  // 作品管理功能
  const handleRevertArtwork = async (id) => {
    const reason = window.prompt('請輸入退回原因：')
    if (!reason) return
    
    setActionLoading(prev => ({ ...prev, [`artwork-${id}`]: 'revert' }))
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
      console.error('Failed to revert artwork:', error)
      alert('操作失敗，請重試')
    } finally {
      setActionLoading(prev => ({ ...prev, [`artwork-${id}`]: null }))
    }
  }

  const handleDeleteArtwork = async (id) => {
    if (!window.confirm('確定要永久刪除這件作品嗎？此操作無法復原！')) return
    
    setActionLoading(prev => ({ ...prev, [`artwork-${id}`]: 'delete' }))
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
      setActionLoading(prev => ({ ...prev, [`artwork-${id}`]: null }))
    }
  }

  // 邀請現有作者建立帳號
  const handleInviteAuthor = async () => {
    const authorId = window.prompt('請輸入作者 ID：')
    const email = window.prompt('請輸入作者 Email：')
    
    if (!authorId || !email) return
    
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const response = await fetch(`${apiUrl}/admin/invite-author`, {
        method: 'POST',
        headers: {
          'X-Admin-Password': '20241231NOdept',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ authorId, email })
      })
      
      if (response.ok) {
        alert('邀請郵件已發送')
      } else {
        const error = await response.json()
        alert(error.error || '發送失敗')
      }
    } catch (error) {
      console.error('Failed to invite author:', error)
      alert('發送失敗，請重試')
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

  // 渲染用戶卡片
  const renderUserCard = (user) => (
    <div key={user.id} className="user-card">
      <div className="user-card-header">
        <div className="user-info">
          <UserCircleIcon className="user-icon" />
          <div>
            <h3>{user.username}</h3>
            <p className="user-email">{user.email}</p>
          </div>
        </div>
        <button
          onClick={() => toggleExpand(`user-${user.id}`)}
          className="expand-button"
        >
          {expandedItem === `user-${user.id}` ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </button>
      </div>

      {expandedItem === `user-${user.id}` && (
        <div className="user-details">
          <div className="detail-row">
            <span className="label">註冊時間：</span>
            <span className="value">{formatDate(user.created_at)}</span>
          </div>
          {user.author_name && (
            <div className="detail-row">
              <span className="label">關聯作者：</span>
              <span className="value">{user.author_name}</span>
            </div>
          )}
          <div className="card-actions">
            <Button
              onClick={() => handleApproveUser(user.id)}
              variant="primary"
              size="small"
              disabled={actionLoading[`user-${user.id}`]}
            >
              {actionLoading[`user-${user.id}`] === 'approve' ? '處理中...' : '通過審核'}
            </Button>
            <Button
              onClick={() => handleRejectUser(user.id)}
              variant="danger"
              size="small"
              disabled={actionLoading[`user-${user.id}`]}
            >
              {actionLoading[`user-${user.id}`] === 'reject' ? '處理中...' : '拒絕'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )

  // 渲染作品卡片（簡化版）
  const renderArtworkCard = (artwork) => (
    <div key={artwork.id} className="artwork-card">
      <div className="artwork-card-body">
        <div className="artwork-card-content">
          <div className="artwork-image-wrapper">
            {artwork.main_image_url ? (
              <img src={artwork.main_image_url} alt={artwork.title} />
            ) : (
              <div className="no-image">無圖片</div>
            )}
          </div>
          <div className="artwork-info">
            <h3>{artwork.title}</h3>
            <p className="artwork-author">作者：{artwork.authors?.join(', ') || artwork.author}</p>
            <p className="artwork-date">發布時間：{formatDate(artwork.created_at)}</p>
          </div>
        </div>
        <div className="card-actions">
          <Button
            onClick={() => handleRevertArtwork(artwork.id)}
            variant="secondary"
            size="small"
            disabled={actionLoading[`artwork-${artwork.id}`]}
          >
            退回草稿
          </Button>
          <Button
            onClick={() => handleDeleteArtwork(artwork.id)}
            variant="danger"
            size="small"
            disabled={actionLoading[`artwork-${artwork.id}`]}
          >
            刪除
          </Button>
        </div>
      </div>
    </div>
  )

  // 未登入畫面
  if (!isAuthenticated) {
    return (
      <Layout>
        <Seo title="管理員登入" />
        <div className="admin-login">
          <div className="login-card">
            <LockClosedIcon className="login-icon" />
            <h1>管理員登入</h1>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="輸入管理員密碼"
                  className={passwordError ? 'error' : ''}
                  autoFocus
                />
                {passwordError && <span className="error-message">{passwordError}</span>}
              </div>
              <Button type="submit" variant="primary" fullWidth>
                登入
              </Button>
            </form>
          </div>
        </div>
      </Layout>
    )
  }

  // 已登入畫面
  return (
    <Layout>
      <Seo title="管理後台" />
      <div className="admin-container">
        {/* 頁面標題 */}
        <div className="admin-header">
          <h1>管理後台</h1>
          <Button onClick={handleLogout} variant="outline" size="small">
            登出
          </Button>
        </div>

        {/* Tab 切換 */}
        <div className="admin-tabs">
          <button
            className={`tab ${activeTab === 'pending-users' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending-users')}
          >
            待審核用戶 {pendingUsers.length > 0 && <span className="badge">{pendingUsers.length}</span>}
          </button>
          <button
            className={`tab ${activeTab === 'artworks' ? 'active' : ''}`}
            onClick={() => setActiveTab('artworks')}
          >
            作品管理
          </button>
          <button
            className="tab"
            onClick={handleInviteAuthor}
          >
            邀請作者
          </button>
        </div>

        {/* 內容區 */}
        <div className="admin-content">
          {loading ? (
            <Loading />
          ) : (
            <>
              {/* 待審核用戶 */}
              {activeTab === 'pending-users' && (
                <div className="content-section">
                  {pendingUsers.length === 0 ? (
                    <div className="empty-state">
                      <UserCircleIcon />
                      <p>目前沒有待審核的用戶</p>
                    </div>
                  ) : (
                    <div className="users-grid">
                      {pendingUsers.map(user => renderUserCard(user))}
                    </div>
                  )}
                </div>
              )}

              {/* 作品管理 */}
              {activeTab === 'artworks' && (
                <div className="content-section">
                  {approvedArtworks.length === 0 ? (
                    <div className="empty-state">
                      <p>目前沒有已發布的作品</p>
                    </div>
                  ) : (
                    <div className="artworks-grid">
                      {approvedArtworks.map(artwork => renderArtworkCard(artwork))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default AdminPage