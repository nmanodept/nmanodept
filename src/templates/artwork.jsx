// /src/templates/artwork.jsx - 修復內測作品顯示
import React, { useState, useEffect } from 'react'
import { Link } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import Loading from '../components/common/Loading'
import './artwork.css'

const ArtworkTemplate = ({ pageContext, location }) => {
  const { id, artwork: initialArtwork } = pageContext
  const [artwork, setArtwork] = useState(initialArtwork || null)
  const [loading, setLoading] = useState(!initialArtwork)
  const [error, setError] = useState(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  
  useEffect(() => {
    // 如果沒有初始資料，從 API 獲取
    if (!artwork) {
      fetchArtwork()
    }
  }, [id])
  
  const fetchArtwork = async () => {
    try {
      setLoading(true)
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const response = await fetch(`${apiUrl}/artwork/${id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('找不到此作品')
        } else {
          setError(`載入失敗: ${response.status}`)
        }
        return
      }
      
      const data = await response.json()
      setArtwork(data)
    } catch (err) {
      console.error('Fetch error:', err)
      setError('載入作品時發生錯誤')
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <Layout>
        <Seo title="載入中..." />
        <Loading />
      </Layout>
    )
  }
  
  if (error || !artwork) {
    return (
      <Layout>
        <Seo title="錯誤" />
        <div className="error-container">
          <h1>無法載入作品</h1>
          <p>{error || '找不到此作品'}</p>
          <Link to="/search" className="btn btn-primary">
            返回搜尋頁面
          </Link>
        </div>
      </Layout>
    )
  }
  
  // 準備顯示資料
  const authorNames = artwork.authors?.join(', ') || artwork.author || '未知作者'
  const allImages = [
    { url: artwork.main_image_url, type: 'main' },
    ...(artwork.gallery_images || []).map(img => ({
      url: img.url || img.image_url,
      type: 'gallery'
    }))
  ].filter(img => img.url)
  
  const currentImage = allImages[activeImageIndex]
  
  return (
    <Layout>
      <Seo 
        title={artwork.title}
        description={artwork.description}
        image={artwork.main_image_url}
      />
      
      <div className="artwork-container">
        {/* 作品標題區 */}
        <div className="artwork-header">
          <h1 className="artwork-title">{artwork.title}</h1>
          <div className="artwork-meta">
            <div className="artwork-authors">
              創作者：
              {artwork.authors && artwork.authors.map((author, index) => (
                <span key={index}>
                  {index > 0 && ', '}
                  <Link to={`/author/${encodeURIComponent(author)}`} className="author-link">
                    {author}
                  </Link>
                </span>
              ))}
            </div>
            {artwork.project_year && (
              <div className="artwork-year">
                {artwork.project_year}年{artwork.project_semester ? ` ${artwork.project_semester}` : ''}作品
              </div>
            )}
          </div>
          
          {/* 標記內測作品或需要免責聲明 */}
          {(artwork.is_beta_artwork || artwork.requires_disclaimer) && (
            <div className="artwork-notice">
              <span className="beta-badge">內測作品</span>
              {artwork.requires_disclaimer && (
                <span className="disclaimer-badge">未確認免責聲明</span>
              )}
            </div>
          )}
        </div>
        
        {/* 圖片展示區 */}
        <div className="artwork-media">
          <div className="main-image-container">
            <img 
              src={currentImage?.url || '/images/placeholder.jpg'} 
              alt={artwork.title}
              className="main-image"
            />
            
            {/* 圖片導航 */}
            {allImages.length > 1 && (
              <>
                <button 
                  className="image-nav prev"
                  onClick={() => setActiveImageIndex((prev) => 
                    prev === 0 ? allImages.length - 1 : prev - 1
                  )}
                  aria-label="上一張"
                >
                  ‹
                </button>
                <button 
                  className="image-nav next"
                  onClick={() => setActiveImageIndex((prev) => 
                    prev === allImages.length - 1 ? 0 : prev + 1
                  )}
                  aria-label="下一張"
                >
                  ›
                </button>
                
                <div className="image-indicators">
                  {allImages.map((_, index) => (
                    <button
                      key={index}
                      className={`indicator ${index === activeImageIndex ? 'active' : ''}`}
                      onClick={() => setActiveImageIndex(index)}
                      aria-label={`圖片 ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          
          {/* 縮圖列表 */}
          {allImages.length > 1 && (
            <div className="thumbnail-list">
              {allImages.map((img, index) => (
                <button
                  key={index}
                  className={`thumbnail ${index === activeImageIndex ? 'active' : ''}`}
                  onClick={() => setActiveImageIndex(index)}
                >
                  <img src={img.url} alt={`縮圖 ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* 作品資訊 */}
        <div className="artwork-content">
          {/* 作品描述 */}
          <section className="artwork-section">
            <h2>作品描述</h2>
            <div className="description">
              {artwork.description || '暫無描述'}
            </div>
          </section>
          
          {/* 類別與標籤 */}
          {(artwork.categories?.length > 0 || artwork.tags?.length > 0) && (
            <section className="artwork-section">
              {artwork.categories?.length > 0 && (
                <div className="categories">
                  <h3>類別</h3>
                  <div className="category-list">
                    {artwork.categories.map((cat, index) => (
                      <span key={index} className="category-tag">
                        {cat.name || cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {artwork.tags?.length > 0 && (
                <div className="tags">
                  <h3>標籤</h3>
                  <div className="tag-list">
                    {artwork.tags.map((tag, index) => (
                      <span key={index} className="tag">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
          
          {/* 影片 */}
          {(artwork.video_url || artwork.gallery_videos?.length > 0) && (
            <section className="artwork-section">
              <h2>相關影片</h2>
              <div className="video-list">
                {artwork.video_url && (
                  <div className="video-item">
                    <a 
                      href={artwork.video_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="video-link"
                    >
                      主要影片連結
                    </a>
                  </div>
                )}
                {artwork.gallery_videos?.map((video, index) => (
                  <div key={index} className="video-item">
                    <a 
                      href={video.url || video.video_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="video-link"
                    >
                      影片 {index + 1}
                    </a>
                  </div>
                ))}
              </div>
            </section>
          )}
          
          {/* 相關連結 */}
          {artwork.social_links?.length > 0 && (
            <section className="artwork-section">
              <h2>相關連結</h2>
              <div className="social-links">
                {artwork.social_links.map((link, index) => (
                  <a 
                    key={index}
                    href={link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="social-link"
                  >
                    {new URL(link).hostname}
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
        
        {/* 返回按鈕 */}
        <div className="artwork-actions">
          <Link to="/search" className="btn btn-outline">
            返回搜尋
          </Link>
          <Link to="/authors" className="btn btn-outline">
            瀏覽創作者
          </Link>
        </div>
      </div>
    </Layout>
  )
}

export default ArtworkTemplate