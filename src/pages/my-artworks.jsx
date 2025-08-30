// /src/pages/my-artworks.jsx - 關鍵部分：修復編輯連結
import React, { useState, useEffect } from 'react'
import { Link, navigate } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import PrivateRoute from '../components/auth/PrivateRoute'
import Loading from '../components/common/Loading'
import { useAuth } from '../components/auth/AuthContext'
import './my-artworks.css'

const MyArtworksPage = () => {
  const { user } = useAuth()
  const [artworks, setArtworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
        setArtworks(data)
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
        fetchMyArtworks()
        alert('作品已刪除')
      } else {
        alert('刪除失敗，請稍後再試')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('刪除失敗，請稍後再試')
    }
  }

  const handleEdit = (artworkId) => {
    // 確保有正確的 ID
    if (!artworkId) {
      console.error('No artwork ID provided')
      return
    }
    // 使用客戶端導航
    navigate(`/edit-artwork/${artworkId}`)
  }

  const renderArtworkCard = (artwork) => {
    const imageUrl = artwork.main_image_url || '/images/placeholder.jpg'
    const authorNames = artwork.authors?.join(', ') || artwork.author || '未知作者'
    
    return (
      <div key={artwork.id} className="artwork-card">
        <div className="artwork-image">
          <img src={imageUrl} alt={artwork.title} loading="lazy" />
          {artwork.status === 'pending' && (
            <div className="status-badge pending">待審核</div>
          )}
        </div>
        <div className="artwork-info">
          <h3>{artwork.title}</h3>
          <p className="artwork-author">{authorNames}</p>
          {artwork.project_year && (
            <p className="artwork-year">{artwork.project_year}年作品</p>
          )}
          {artwork.categories && artwork.categories.length > 0 && (
            <div className="artwork-categories">
              {artwork.categories.map(cat => (
                <span key={cat.id} className="category-tag">
                  {cat.name}
                </span>
              ))}
            </div>
          )}
          {artwork.tags && artwork.tags.length > 0 && (
            <div className="artwork-tags">
              {artwork.tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="tag">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <div className="artwork-actions">
            <button
              onClick={() => handleEdit(artwork.id)}
              className="btn btn-sm btn-outline"
            >
              編輯
            </button>
            <button
              onClick={() => handleDelete(artwork.id)}
              className="btn btn-sm btn-danger"
            >
              刪除
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <PrivateRoute>
        <Layout>
          <Seo title="我的作品" />
          <Loading />
        </Layout>
      </PrivateRoute>
    )
  }

  return (
    <PrivateRoute>
      <Layout>
        <Seo title="我的作品" />
        <div className="my-artworks-container">
          <div className="my-artworks-header">
            <h1>我的作品</h1>
            <Link to="/submit" className="btn btn-primary">
              投稿新作品
            </Link>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <section className="artworks-section">
            <h2>我的作品集</h2>
            {artworks.length > 0 ? (
              <div className="artworks-grid">
                {artworks.map(artwork => renderArtworkCard(artwork))}
              </div>
            ) : (
              <div className="empty-state">
                <p>您還沒有發布任何作品</p>
                <Link to="/submit" className="btn btn-primary">
                  投稿第一件作品
                </Link>
              </div>
            )}
          </section>
        </div>
      </Layout>
    </PrivateRoute>
  )
}

export default MyArtworksPage