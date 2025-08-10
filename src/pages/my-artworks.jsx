// ========== /src/pages/my-artworks.jsx ==========
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
  const [pendingArtworks, setPendingArtworks] = useState([])
  const [needsDisclaimer, setNeedsDisclaimer] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
      
      const response = await fetch(`${apiUrl}/user/artworks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        
        // 分類作品
        const approved = data.filter(a => a.status === 'approved')
        const pending = data.filter(a => a.status === 'pending')
        const disclaimer = data.filter(a => a.status === 'needs_disclaimer')
        
        setArtworks(approved)
        setPendingArtworks(pending)
        setNeedsDisclaimer(disclaimer)
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

  const renderArtworkCard = (artwork, showActions = true) => {
    const imageUrl = artwork.main_image_url || '/images/placeholder.jpg'
    const authorNames = artwork.authors?.join(', ') || artwork.author || '未知作者'
    
    return (
      <div key={artwork.id} className="artwork-card">
        <div className="artwork-image">
          <img src={imageUrl} alt={artwork.title} />
          {artwork.status === 'pending' && (
            <div className="status-badge pending">待審核</div>
          )}
          {artwork.status === 'needs_disclaimer' && (
            <div className="status-badge disclaimer">需確認</div>
          )}
        </div>
        <div className="artwork-info">
          <h3>{artwork.title}</h3>
          <p className="artwork-author">{authorNames}</p>
          {artwork.project_year && (
            <p className="artwork-year">{artwork.project_year}年作品</p>
          )}
          {showActions && (
            <div className="artwork-actions">
              {artwork.status === 'approved' && (
                <>
                  <Link 
                    to={`/edit-artwork/${artwork.id}`} 
                    className="btn btn-sm btn-outline"
                  >
                    編輯
                  </Link>
                  <button
                    onClick={() => handleDelete(artwork.id)}
                    className="btn btn-sm btn-danger"
                  >
                    刪除
                  </button>
                </>
              )}
              {artwork.status === 'needs_disclaimer' && (
                <button
                  onClick={() => handleAcceptDisclaimer(artwork.id)}
                  className="btn btn-sm btn-primary"
                >
                  接受免責聲明
                </button>
              )}
            </div>
          )}
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

          {needsDisclaimer.length > 0 && (
            <section className="artworks-section">
              <h2>需要確認免責聲明</h2>
              <p className="section-description">
                這些是您在內測時期提交的作品，需要確認免責聲明後才能重新發布
              </p>
              <div className="artworks-grid">
                {needsDisclaimer.map(artwork => renderArtworkCard(artwork))}
              </div>
            </section>
          )}

          {pendingArtworks.length > 0 && (
            <section className="artworks-section">
              <h2>待審核作品</h2>
              <div className="artworks-grid">
                {pendingArtworks.map(artwork => renderArtworkCard(artwork, false))}
              </div>
            </section>
          )}

          <section className="artworks-section">
            <h2>已發布作品</h2>
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
