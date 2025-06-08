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
  const [activeTab, setActiveTab] = useState('pending') // 'pending', 'approved', 'profiles', 'categories'
  const [pendingArtworks, setPendingArtworks] = useState([])
  const [approvedArtworks, setApprovedArtworks] = useState([])
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
  const fetchPendingArtworks = useCallback(async () => {
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
  }, [])

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
      if (activeTab === 'pending') {
        fetchPendingArtworks()
      } else if (activeTab === 'approved') {
        fetchApprovedArtworks()
      } else if (activeTab === 'profiles') {
        fetchPendingProfiles()
      } else if (activeTab === 'categories') {
        fetchCategories()
      }
    }
  }, [isAuthenticated, activeTab, refreshKey, fetchPendingArtworks, fetchApprovedArtworks, fetchPendingProfiles, fetchCategories])

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
    <div key={artwork.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start gap-6">
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
          
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {artwork.title}
            </h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                <span>作者：{artwork.authors?.join(', ') || artwork.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                <span>創作年份：{artwork.year}</span>
              </div>
              <div className="flex items-center gap-2">
                <FolderIcon className="w-4 h-4" />
                <span>類別：{artwork.category_name || '未分類'}</span>
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
                {expandedItem === artwork.id ? '收合' : '預覽'}
                {expandedItem === artwork.id ? (
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
      {expandedItem === artwork.id && (
        <div className="border-t border-gray-200 bg-gray-50 p-6">
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">作品簡介</h4>
              <p className="text-gray-700 whitespace-pre-wrap">{artwork.description}</p>
            </div>
            
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

  // 渲染作者資料卡片
  const renderProfileCard = (profile) => (
    <div key={profile.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.author_name}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                <UserCircleIcon className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {profile.author_name}
            </h3>
            
            <div className="text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                <span>提交時間：{formatDate(profile.created_at)}</span>
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-1">簡介：</h4>
              <p className="text-gray-700 text-sm line-clamp-3">
                {profile.bio}
              </p>
            </div>
            
            {profile.social_links && profile.social_links.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-1">社交連結：</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.social_links.map((link, index) => (
                    <a
                      key={index}
                      href={link.includes('http') ? link : `https://${link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      連結 {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <Button
                size="sm"
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
    </div>
  )

  // 未登入狀態
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

  // 已登入狀態
  return (
    <Layout>
      <Seo title="管理員後台" />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">管理員後台</h1>
            <p className="text-gray-600 mt-1">管理所有內容</p>
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
            待審核作品 ({pendingArtworks.length})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`pb-4 px-2 font-medium text-sm transition-colors ${
              activeTab === 'approved'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            已審核作品 ({approvedArtworks.length})
          </button>
          <button
            onClick={() => setActiveTab('profiles')}
            className={`pb-4 px-2 font-medium text-sm transition-colors ${
              activeTab === 'profiles'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            待審核作者資料 ({pendingProfiles.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`pb-4 px-2 font-medium text-sm transition-colors ${
              activeTab === 'categories'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            類別管理 ({categories.length})
          </button>
        </div>
        
        {/* 內容區域 */}
        {loading ? (
          <Loading type="spinner" size="lg" text="載入中..." />
        ) : (
          <div>
            {/* 作品列表 */}
            {(activeTab === 'pending' || activeTab === 'approved') && (
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
            
            {/* 作者資料列表 */}
            {activeTab === 'profiles' && (
              <div className="space-y-6">
                {pendingProfiles.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50 rounded-lg">
                    <UserCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">目前沒有待審核的作者資料</p>
                  </div>
                ) : (
                  pendingProfiles.map(profile => renderProfileCard(profile))
                )}
              </div>
            )}
            
            {/* 類別管理 */}
            {activeTab === 'categories' && (
              <div>
                <div className="mb-6">
                  <Button
                    onClick={() => setShowAddCategory(!showAddCategory)}
                    size="sm"
                  >
                    <PlusIcon className="w-4 h-4 mr-1" />
                    新增類別
                  </Button>
                </div>
                
                {showAddCategory && (
                  <form onSubmit={handleCreateCategory} className="bg-gray-50 rounded-lg p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          類別名稱 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="例如：數位藝術"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          類別說明
                        </label>
                        <input
                          type="text"
                          value={newCategoryDescription}
                          onChange={(e) => setNewCategoryDescription(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="選填"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button type="submit" size="sm">
                        創建
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
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
                
                <div className="space-y-4">
                  {categories.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-lg">
                      <FolderIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg">尚未建立任何類別</p>
                    </div>
                  ) : (
                    categories.map(category => (
                      <div key={category.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{category.name}</h4>
                          {category.description && (
                            <p className="text-sm text-gray-600 mt-1">{category.description}</p>
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

export default AdminPage;