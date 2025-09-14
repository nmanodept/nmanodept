// /src/pages/my-artworks.jsx - 完整修復版
import React, { useState, useEffect } from 'react'
import { Link, navigate } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import PrivateRoute from '../components/auth/PrivateRoute'
import Loading from '../components/common/Loading'
import Button from '../components/common/Button'
import { useAuth } from '../components/auth/AuthContext'
import './my-artworks.css'

const MyArtworksPage = () => {
  const { user } = useAuth()
  const [artworks, setArtworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    if (user) {
      fetchMyArtworks()
    }
  }, [user])

  const fetchMyArtworks = async () => {
    setLoading(true)
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const token = localStorage.getItem('authToken')
      
      const response = await fetch(`${apiUrl}/user/artworks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        // 處理資料格式
        const processedData = data.map(artwork => ({
          ...artwork,
          tags: Array.isArray(artwork.tags) ? artwork.tags : 
                typeof artwork.tags === 'string' ? JSON.parse(artwork.tags || '[]') : [],
          authors: Array.isArray(artwork.authors) ? artwork.authors :
                   typeof artwork.authors === 'string' ? JSON.parse(artwork.authors || '[]') : [],
          categories: Array.isArray(artwork.categories) ? artwork.categories :
                      typeof artwork.categories === 'string' ? JSON.parse(artwork.categories || '[]') : []
        }))
        setArtworks(processedData)
      } else if (response.status === 401) {
        navigate('/login')
      } else {
        setError('無法載入作品')
      }
    } catch (error) {
      console.error('Failed to fetch artworks:', error)
      setError('載入失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('確定要刪除此作品嗎？此操作無法復原。')) {
      return
    }

    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const token = localStorage.getItem('authToken')
      
      const response = await fetch(`${apiUrl}/artwork/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        setArtworks(prev => prev.filter(artwork => artwork.id !== id))
        setDeleteConfirm(null)
      } else {
        alert('刪除失敗，請稍後再試')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('刪除失敗，請稍後再試')
    }
  }

  // 處理編輯按鈕 - 修復路由問題
  const handleEdit = (artworkId) => {
    // 確保 artworkId 存在且有效
    if (!artworkId) {
      console.error('Invalid artwork ID')
      return
    }
    // 使用正確的路由格式
    navigate(`/edit-artwork/${artworkId}`)
  }

  if (!user) {
    return (
      <Layout>
        <Seo title="我的作品集" />
        <div className="auth-required">
          <h2>請先登入</h2>
          <p>您需要登入才能查看您的作品集</p>
          <Link to="/login" className="btn btn-primary">
            前往登入
          </Link>
        </div>
      </Layout>
    )
  }

  if (loading) {
    return (
      <Layout>
        <Seo title="我的作品集" />
        <Loading />
      </Layout>
    )
  }

  return (
    <PrivateRoute>
      <Layout>
        <Seo title="我的作品集" />
        
        <div className="my-artworks-container">
          <div className="my-artworks-header">
            <h1>我的作品集</h1>
            <Link to="/submit" className="btn btn-primary">
              + 新增作品
            </Link>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={fetchMyArtworks} className="btn btn-outline">
                重新載入
              </button>
            </div>
          )}

          {artworks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                  <rect x="10" y="20" width="60" height="40" rx="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M10 30H70" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="40" cy="45" r="8" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h2>還沒有作品</h2>
              <p>開始上傳您的第一個作品吧！</p>
              <Link to="/submit" className="btn btn-primary">
                上傳作品
              </Link>
            </div>
          ) : (
            <div className="artworks-grid">
              {artworks.map(artwork => (
                <div key={artwork.id} className="artwork-card">
                  <Link to={`/art/${artwork.id}`} className="artwork-link">
                    <div className="artwork-image">
                      <img 
                        src={artwork.main_image_url || '/images/placeholder.jpg'} 
                        alt={artwork.title}
                        onError={(e) => {
                          e.target.src = '/images/placeholder.jpg'
                        }}
                      />
                      {artwork.status === 'pending' && (
                        <div className="status-badge pending">待審核</div>
                      )}
                      {artwork.status === 'rejected' && (
                        <div className="status-badge rejected">已駁回</div>
                      )}
                    </div>
                  </Link>
                  
                  <div className="artwork-info">
                    <h3>{artwork.title}</h3>
                    <p className="artwork-meta">
                      {artwork.authors?.join(' 、 ') || user.authorName}
                      {artwork.project_year && ` · ${artwork.project_year}`}
                    </p>
                    
                    {/* 類別和標籤 */}
                    <div className="artwork-details">
                      {artwork.categories && artwork.categories.length > 0 && (
                        <div className="categories">
                          {artwork.categories.map((cat, index) => (
                            <span key={index} className="category-badge">
                              {typeof cat === 'object' ? cat.name : cat}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {artwork.tags && artwork.tags.length > 0 && (
                        <div className="tags">
                          {artwork.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="tag-badge">
                              {tag}
                            </span>
                          ))}
                          {artwork.tags.length > 3 && (
                            <span className="tag-badge more">+{artwork.tags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                  </div>
                  
                  {/* 操作按鈕 */}
                  <div className="artwork-actions">
                    <button 
                      onClick={() => handleEdit(artwork.id)}
                      className="btn-edit"
                      aria-label="編輯作品"
                      title="編輯作品"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M11.5 1.5a2.121 2.121 0 013 3L5 14l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    
                    <button 
                      onClick={() => setDeleteConfirm(artwork.id)}
                      className="btn-delete"
                      aria-label="刪除作品"
                      title="刪除作品"
                    >
                      <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                      </svg>
                    </button>
                    
                    {/* 刪除確認對話框 */}
                    {deleteConfirm === artwork.id && (
                      <div className="delete-confirm">
                        <p>確定要刪除「{artwork.title}」嗎？</p>
                        <div className="confirm-actions">
                          <button 
                            onClick={() => handleDelete(artwork.id)}
                            className="btn btn-danger"
                          >
                            確定刪除
                          </button>
                          <button 
                            onClick={() => setDeleteConfirm(null)}
                            className="btn btn-outline"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    </PrivateRoute>
  )
}

export default MyArtworksPage