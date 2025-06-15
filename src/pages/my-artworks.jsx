//Location: /src/pages/my-artworks.jsx
import React, { useState, useEffect } from 'react'
import { Link, navigate } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import PrivateRoute from '../components/auth/PrivateRoute'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Loading from '../components/common/Loading'
import { useAuth } from '../components/auth/AuthContext'
import './my-artworks.css'

const MyArtworksPage = () => {
  const { user } = useAuth()
  const [artworks, setArtworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingArtworks, setPendingArtworks] = useState([])
  const [needsDisclaimer, setNeedsDisclaimer] = useState([])

  useEffect(() => {
    if (user) {
      fetchMyArtworks()
    }
  }, [user])

  const fetchMyArtworks = async () => {
    try {
      setLoading(true)
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const token = localStorage.getItem('authToken')
      
      if (!token) {
        setError('請先登入')
        setLoading(false)
        return
      }
      
      const response = await fetch(`${apiUrl}/user/artworks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        
        // 確保每個作品都有正確的資料結構
        const normalizedData = data.map(artwork => ({
          ...artwork,
          authors: Array.isArray(artwork.authors) ? artwork.authors : 
                   (artwork.author ? [artwork.author] : []),
          tags: Array.isArray(artwork.tags) ? artwork.tags : [],
          categories: Array.isArray(artwork.categories) ? artwork.categories : [],
          social_links: Array.isArray(artwork.social_links) ? artwork.social_links : [],
          gallery_images: Array.isArray(artwork.gallery_images) ? artwork.gallery_images : [],
          gallery_videos: Array.isArray(artwork.gallery_videos) ? artwork.gallery_videos : []
        }))
        
        // 分類作品
        const approved = normalizedData.filter(a => a.status === 'approved')
        const pending = normalizedData.filter(a => a.status === 'pending')
        const needDisclaimer = normalizedData.filter(a => a.status === 'needs_disclaimer')
        
        setArtworks(approved)
        setPendingArtworks(pending)
        setNeedsDisclaimer(needDisclaimer)
        setError('')
      } else if (response.status === 401) {
        setError('請重新登入')
        localStorage.removeItem('authToken')
        navigate('/login')
      } else {
        setError('無法載入作品資料')
      }
    } catch (error) {
      console.error('Fetch error:', error)
      setError('載入失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('確定要刪除這件作品嗎？此操作無法復原。')) return

    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const token = localStorage.getItem('authToken')
      
      const response = await fetch(`${apiUrl}/artwork/${id}/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        alert('作品已刪除')
        fetchMyArtworks()
      } else {
        alert('刪除失敗，請稍後再試')
      }
    } catch (error) {
      alert('刪除失敗，請稍後再試')
    }
  }

  const handleAcceptDisclaimer = async (id) => {
    if (!window.confirm('確認接受免責聲明並重新發布此作品？')) return

    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const token = localStorage.getItem('authToken')
      
      const response = await fetch(`${apiUrl}/artwork/${id}/accept-disclaimer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        alert('作品已重新發布')
        fetchMyArtworks()
      } else {
        alert('操作失敗，請稍後再試')
      }
    } catch (error) {
      alert('操作失敗，請稍後再試')
    }
  }

  const renderArtworkCard = (artwork) => {
    // 確保資料正確
    const safeArtwork = {
      id: artwork.id,
      title: artwork.title || '未命名作品',
      main_image_url: artwork.main_image_url,
      author: artwork.authors?.[0] || artwork.author || '未知作者',
      tags: artwork.tags || [],
      project_year: artwork.project_year,
      view_count: artwork.view_count || 0
    }

    return (
      <Card
        key={safeArtwork.id}
        id={safeArtwork.id}
        title={safeArtwork.title}
        imageUrl={safeArtwork.main_image_url}
        author={safeArtwork.author}
        tags={safeArtwork.tags}
        year={safeArtwork.project_year}
        viewCount={safeArtwork.view_count}
      />
    )
  }

  if (loading) return <Layout><Loading /></Layout>

  return (
    <PrivateRoute>
      <Layout>
        <Seo title="我的作品" />
        <div className="my-artworks-container">
          <div className="my-artworks-header">
            <h1>我的作品</h1>
            <div className="header-actions">
              <Link to="/profile" className="nav-link">
                個人資料
              </Link>
              <Button onClick={() => navigate('/submit')} variant="primary">
                投稿新作品
              </Button>
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {/* 需要免責聲明的作品 */}
          {needsDisclaimer.length > 0 && (
            <div className="artworks-section">
              <h2>需要確認的作品</h2>
              <div className="disclaimer-notice">
                <p>以下是您在內測時期投稿的作品，需要您確認接受免責聲明後才能重新發布：</p>
                <div className="disclaimer-text">
                  <h4>免責聲明</h4>
                  <p>本平台僅提供新媒系作品紀錄性質用，不屬於公開發表。平台不會拿個人資料商用、修改，並且沒有作品的使用權。本平台不負責作品的保管與備份。投稿者同意將個人資訊（姓名、作品資訊等）公開展示於平台。投稿者須確保作品為原創或已獲得合法授權。如作品涉及版權爭議，平台不承擔任何法律責任。平台保留移除不當內容的權利。</p>
                </div>
              </div>
              
              <div className="artworks-grid">
                {needsDisclaimer.map(artwork => (
                  <div key={artwork.id} className="artwork-card needs-disclaimer">
                    {renderArtworkCard(artwork)}
                    <div className="card-actions">
                      <Button 
                        onClick={() => handleAcceptDisclaimer(artwork.id)}
                        variant="primary"
                        size="small"
                      >
                        接受免責聲明並發布
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 待審核作品 */}
          {pendingArtworks.length > 0 && (
            <div className="artworks-section">
              <h2>待審核作品</h2>
              <div className="artworks-grid">
                {pendingArtworks.map(artwork => (
                  <div key={artwork.id} className="artwork-card pending">
                    {renderArtworkCard(artwork)}
                    <div className="card-status">
                      <span className="status-badge pending">待審核</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 已發布作品 */}
          <div className="artworks-section">
            <h2>已發布作品</h2>
            {artworks.length === 0 ? (
              <div className="empty-state">
                <p>您還沒有已發布的作品</p>
                <Button onClick={() => navigate('/submit')} variant="primary">
                  投稿第一件作品
                </Button>
              </div>
            ) : (
              <div className="artworks-grid">
                {artworks.map(artwork => (
                  <div key={artwork.id} className="artwork-card">
                    {renderArtworkCard(artwork)}
                    <div className="card-actions">
                      <Button 
                        onClick={() => navigate(`/artwork/${artwork.id}/edit`)}
                        variant="secondary"
                        size="small"
                      >
                        編輯
                      </Button>
                      <Button 
                        onClick={() => handleDelete(artwork.id)}
                        variant="danger"
                        size="small"
                      >
                        刪除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </PrivateRoute>
  )
}

export default MyArtworksPage