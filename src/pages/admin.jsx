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
  ChevronUpIcon
} from '@heroicons/react/24/outline'

const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [pendingArtworks, setPendingArtworks] = useState([])
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

  // 載入待審核作品
  useEffect(() => {
    if (isAuthenticated) {
      fetchPendingArtworks()
    }
  }, [isAuthenticated, refreshKey])

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
  }

  // 獲取待審核作品
  const fetchPendingArtworks = async () => {
    setLoading(true)
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      console.log('Fetching from:', `${apiUrl}/admin/pending`) // 除錯用
      
      const response = await fetch(`${apiUrl}/admin/pending`, {
        method: 'GET',
        headers: {
          'X-Admin-Password': '20241231NOdept',
          'Content-Type': 'application/json'
        }
      })
      
      console.log('Response status:', response.status) // 除錯用
      
      if (response.ok) {
        const data = await response.json()
        console.log('Pending artworks:', data) // 除錯用
        
        // 解析標籤資料
        const artworksWithParsedData = data.map(artwork => ({
          ...artwork,
          tags: typeof artwork.tags === 'string' ? JSON.parse(artwork.tags || '[]') : artwork.tags || [],
          gallery_images: typeof artwork.gallery_images === 'string' ? JSON.parse(artwork.gallery_images || '[]') : artwork.gallery_images || [],
          gallery_videos: typeof artwork.gallery_videos === 'string' ? JSON.parse(artwork.gallery_videos || '[]') : artwork.gallery_videos || []
        }))
        setPendingArtworks(artworksWithParsedData)
      } else if (response.status === 401) {
        console.error('Unauthorized - logging out')
        handleLogout()
      } else {
        const errorData = await response.text()
        console.error('Error response:', errorData)
      }
    } catch (error) {
      console.error('Failed to fetch pending artworks:', error)
      alert('無法載入待審核作品，請檢查網路連線或稍後再試')
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
        // 重新載入列表
        setRefreshKey(prev => prev + 1)
        alert('作品已通過審核！')
      } else {
        const error = await response.text()
        console.error('Approve error:', error)
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
        // 重新載入列表
        setRefreshKey(prev => prev + 1)
        alert('作品已駁回')
      } else {
        const error = await response.text()
        console.error('Reject error:', error)
        alert('操作失敗，請重試')
      }
    } catch (error) {
      console.error('Failed to reject artwork:', error)
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
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

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
            <p className="text-gray-600 mt-1">審核待發布的作品</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            登出
          </Button>
        </div>
        
        {/* 統計資訊 */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-8">
          <p className="text-orange-800">
            目前有 <span className="font-bold text-orange-900">{pendingArtworks.length}</span> 件作品待審核
          </p>
        </div>
        
        {/* 作品列表 */}
        {loading ? (
          <Loading type="spinner" size="lg" text="載入待審核作品..." />
        ) : pendingArtworks.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">太好了！目前沒有待審核的作品</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingArtworks.map((artwork) => (
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
                          <span>提交時間：{formatDate(artwork.created_at)}</span>
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
                      {artwork.social_link && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                            <LinkIcon className="w-5 h-5" />
                            社群連結
                          </h4>
                          <a 
                            href={artwork.social_link.includes('http') ? artwork.social_link : `https://${artwork.social_link}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {artwork.social_link}
                          </a>
                        </div>
                      )}
                      
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
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default AdminPage