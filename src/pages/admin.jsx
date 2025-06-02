// src/pages/admin.jsx
import React, { useState, useEffect } from 'react'
import { navigate } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import Button from '../components/common/Button'
import Loading from '../components/common/Loading'
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
  ArrowUturnLeftIcon
} from '@heroicons/react/24/outline'

const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [activeTab, setActiveTab] = useState('pending') // 'pending' or 'approved'
  const [pendingArtworks, setPendingArtworks] = useState([])
  const [approvedArtworks, setApprovedArtworks] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState({})
  const [expandedArtwork, setExpandedArtwork] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // 檢查是否已經登入（使用 sessionStorage）
  useEffect(() => {
    const savedAuth = sessionStorage.getItem('adminAuth')
    if (savedAuth === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  // 載入作品
  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'pending') {
        fetchPendingArtworks()
      } else {
        fetchApprovedArtworks()
      }
    }
  }, [isAuthenticated, activeTab, refreshKey])

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
    setPendingArtworks([])
    setApprovedArtworks([])
  }

  // 獲取待審核作品
  const fetchPendingArtworks = async () => {
    setLoading(true)
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      
      const response = await fetch(`${apiUrl}/admin/pending`, {
        method: 'GET',
        headers: {
          'X-Admin-Password': '20241231NOdept',
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPendingArtworks(data)
      } else if (response.status === 401) {
        handleLogout()
      }
    } catch (error) {
      console.error('Failed to fetch pending artworks:', error)
      alert('無法載入待審核作品，請檢查網路連線或稍後再試')
    } finally {
      setLoading(false)
    }
  }

  // 獲取已審核作品
  const fetchApprovedArtworks = async () => {
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
  }

  // 通過審核
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

  // 駁回審核
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

  // 刪除作品
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

  // 改回待審核
  const handleRevert = async (id) => {
    if (!window.confirm('確定要將這件作品改回待審核狀態嗎？')) return
    
    setActionLoading(prev => ({ ...prev, [id]: 'revert' }))
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const response = await fetch(`${apiUrl}/admin/revert/${id}`, {
        method: 'PUT',
        headers: {
          'X-Admin-Password': '20241231NOdept',
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        setRefreshKey(prev => prev + 1)
        alert('作品已改回待審核狀態')
      } else {
        alert('操作失敗，請重試')
      }
    } catch (error) {
      console.error('Failed to revert artwork:', error)
      alert('操作失敗，請重試')
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }))
    }
  }

  // 切換展開/收合
  const toggleExpand = (id) => {
    setExpandedArtwork(expandedArtwork === id ? null : id)
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
    <div key={artwork.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* 作品摘要 */}
      <div className="p-6">
        <div className="flex items-start gap-6">
          {/* 預覽圖 */}
          <div className="flex-shrink-0">
            {artwork.main_image_url ? (
              <img 
                src={artwork.main_image_url} 
                alt={artwork.title}
                className="w-32 h-32 object-cover rounded-lg"
              />
            ) : (
              <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                <PhotoIcon className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>
          
          {/* 基本資訊 */}
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {artwork.title}
            </h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                <span>作者：{artwork.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                <span>創作年份：{artwork.year}</span>
              </div>
              <div className="flex items-center gap-2">
                <TagIcon className="w-4 h-4" />
                <span>學年度：{artwork.project_year} · {artwork.project_semester}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                <span>{isPending ? '提交' : '審核'}時間：{formatDate(isPending ? artwork.created_at : artwork.updated_at)}</span>
              </div>
            </div>
            
            {/* 標籤 */}
            {artwork.tags && artwork.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {artwork.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            {/* 操作按鈕 */}
            <div className="flex gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => toggleExpand(artwork.id)}
              >
                <EyeIcon className="w-4 h-4 mr-1" />
                {expandedArtwork === artwork.id ? '收合' : '預覽'}
                {expandedArtwork === artwork.id ? (
                  <ChevronUpIcon className="w-4 h-4 ml-1" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4 ml-1" />
                )}
              </Button>
              
              {isPending ? (
                <>
                  <Button
                    size="sm"
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
                    variant="outline"
                    onClick={() => handleRevert(artwork.id)}
                    disabled={actionLoading[artwork.id] !== undefined}
                    loading={actionLoading[artwork.id] === 'revert'}
                  >
                    <ArrowUturnLeftIcon className="w-4 h-4 mr-1" />
                    改回待審核
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
      
      {/* 展開的詳細內容 */}
      {expandedArtwork === artwork.id && (
        <div className="border-t border-gray-200 bg-gray-50 p-6">
          <div className="space-y-6">
            {/* 作品簡介 */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">作品簡介</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{artwork.description}</p>
            </div>
            
            {/* 影片連結 */}
            {artwork.video_url && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <PlayIcon className="w-5 h-5" />
                  作品紀錄影片
                </h4>
                <a 
                  href={artwork.video_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {artwork.video_url}
                </a>
              </div>
            )}
            
            {/* 社群連結 */}
            {(artwork.social_links && artwork.social_links.length > 0) || artwork.social_link ? (
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  社群連結
                </h4>
                {artwork.social_links && artwork.social_links.length > 0 ? (
                  <ul className="space-y-1">
                    {artwork.social_links.map((link, index) => (
                      <li key={index}>
                        <a 
                          href={link.includes('http') ? link : `https://${link}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : artwork.social_link ? (
                  <a 
                    href={artwork.social_link.includes('http') ? artwork.social_link : `https://${artwork.social_link}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {artwork.social_link}
                  </a>
                ) : null}
              </div>
            ) : null}
            
            {/* Gallery 圖片 */}
            {artwork.gallery_images && artwork.gallery_images.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">其他展示圖片</h4>
                <div className="grid grid-cols-4 gap-2">
                  {artwork.gallery_images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-24 object-cover rounded"
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Gallery 影片 */}
            {artwork.gallery_videos && artwork.gallery_videos.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">其他影片連結</h4>
                <ul className="space-y-1">
                  {artwork.gallery_videos.map((video, index) => (
                    <li key={index}>
                      <a 
                        href={video} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        影片 {index + 1}: {video}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )

  // 未登入狀態 - 顯示登入表單
  if (!isAuthenticated) {
    return (
      <Layout>
        <Seo title="管理員登入" />
        
        <div className="min-h-[70vh] flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center mb-8">
                <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <LockClosedIcon className="w-8 h-8 text-orange-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">管理員登入</h1>
                <p className="text-gray-600 mt-2">請輸入管理員密碼</p>
              </div>
              
              <form onSubmit={handleLogin}>
                <div className="mb-6">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
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
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      passwordError ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="輸入管理員密碼"
                    autoFocus
                  />
                  {passwordError && (
                    <p className="mt-2 text-sm text-red-600">{passwordError}</p>
                  )}
                </div>
                
                <Button type="submit" fullWidth size="lg">
                  登入
                </Button>
              </form>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // 已登入狀態 - 顯示管理介面
  return (
    <Layout>
      <Seo title="管理員後台" />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 頂部標題列 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">管理員後台</h1>
            <p className="text-gray-600 mt-1">管理所有作品</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            登出
          </Button>
        </div>
        
        {/* 標籤切換 */}
        <div className="flex space-x-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-4 px-2 font-medium text-sm transition-colors ${
              activeTab === 'pending'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            待審核 ({pendingArtworks.length})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`pb-4 px-2 font-medium text-sm transition-colors ${
              activeTab === 'approved'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            已審核 ({approvedArtworks.length})
          </button>
        </div>
        
        {/* 統計資訊 */}
        <div className={`${activeTab === 'pending' ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'} border rounded-lg p-4 mb-8`}>
          <p className={activeTab === 'pending' ? 'text-orange-800' : 'text-green-800'}>
            {activeTab === 'pending' ? (
              <>目前有 <span className="font-bold text-orange-900">{pendingArtworks.length}</span> 件作品待審核</>
            ) : (
              <>目前有 <span className="font-bold text-green-900">{approvedArtworks.length}</span> 件作品已審核通過</>
            )}
          </p>
        </div>
        
        {/* 作品列表 */}
        {loading ? (
          <Loading type="spinner" size="lg" text={`載入${activeTab === 'pending' ? '待審核' : '已審核'}作品...`} />
        ) : (
          <div className="space-y-6">
            {activeTab === 'pending' ? (
              pendingArtworks.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-lg">
                  <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">太好了！目前沒有待審核的作品</p>
                </div>
              ) : (
                pendingArtworks.map(artwork => renderArtworkCard(artwork, true))
              )
            ) : (
              approvedArtworks.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 text-lg">目前沒有已審核的作品</p>
                </div>
              ) : (
                approvedArtworks.map(artwork => renderArtworkCard(artwork, false))
              )
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default AdminPage