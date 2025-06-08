// /src/pages/artwork.jsx
import React, { useState, useEffect } from 'react'
import { Link } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import './artwork.css'

const ArtworkTemplate = ({ pageContext }) => {
  const { id } = pageContext
  const [artwork, setArtwork] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const [mediaList, setMediaList] = useState([])

  useEffect(() => {
    fetchArtwork()
  }, [id])

  useEffect(() => {
    if (artwork && artwork.id) {
      incrementViewCount()
    }
  }, [artwork])

  const fetchArtwork = async () => {
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const response = await fetch(`${apiUrl}/artwork/${id}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setArtwork(data)
      
      // 建立媒體列表
      const media = []
      
      if (data.main_image_url) {
        media.push({
          type: 'image',
          url: data.main_image_url,
          title: '作品主圖'
        })
      }
      
      if (data.video_url) {
        media.push({
          type: 'video',
          url: data.video_url,
          title: '作品紀錄影片',
          embedUrl: getEmbedUrl(data.video_url)
        })
      }
      
      if (data.gallery_images && Array.isArray(data.gallery_images)) {
        data.gallery_images.forEach((url, index) => {
          media.push({
            type: 'image',
            url: url,
            title: `展示圖片 ${index + 1}`
          })
        })
      }
      
      if (data.gallery_videos && Array.isArray(data.gallery_videos)) {
        data.gallery_videos.forEach((url, index) => {
          media.push({
            type: 'video',
            url: url,
            title: `展示影片 ${index + 1}`,
            embedUrl: getEmbedUrl(url)
          })
        })
      }
      
      setMediaList(media)
      setLoading(false)
    } catch (err) {
      console.error('Fetch error:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  const incrementViewCount = async () => {
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      await fetch(`${apiUrl}/artwork/${id}/view`, {
        method: 'POST'
      })
    } catch (error) {
      console.error('Failed to increment view count:', error)
    }
  }

  const getEmbedUrl = (url) => {
    if (!url) return null
    
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`
    }
    
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`
    }
    
    return null
  }

  const getSocialIcon = (url) => {
    if (!url) return '🔗'
    
    const urlLower = url.toLowerCase()
    if (urlLower.includes('instagram.com')) return '📷'
    if (urlLower.includes('github.com')) return '💻'
    if (urlLower.includes('behance.net')) return '🎨'
    if (urlLower.includes('dribbble.com')) return '🏀'
    if (urlLower.includes('linkedin.com')) return '💼'
    if (urlLower.includes('@') && !urlLower.includes('http')) return '✉️'
    return '🌐'
  }

  const getSocialPlatformName = (url) => {
    if (!url) return '連結'
    
    const urlLower = url.toLowerCase()
    if (urlLower.includes('instagram.com')) return 'Instagram'
    if (urlLower.includes('github.com')) return 'GitHub'
    if (urlLower.includes('behance.net')) return 'Behance'
    if (urlLower.includes('dribbble.com')) return 'Dribbble'
    if (urlLower.includes('linkedin.com')) return 'LinkedIn'
    if (urlLower.includes('@') && !urlLower.includes('http')) return 'Email'
    return '查看連結'
  }

  const navigateMedia = (direction) => {
    if (direction === 'prev') {
      setCurrentMediaIndex((prev) => 
        prev === 0 ? mediaList.length - 1 : prev - 1
      )
    } else {
      setCurrentMediaIndex((prev) => 
        prev === mediaList.length - 1 ? 0 : prev + 1
      )
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="artwork-loading">
          <div className="loading-spinner"></div>
          <p>載入作品中...</p>
        </div>
      </Layout>
    )
  }

  if (error || !artwork) {
    return (
      <Layout>
        <div className="artwork-error">
          <p>{error || '找不到作品'}</p>
          <Link to="/" className="error-link">返回首頁</Link>
        </div>
      </Layout>
    )
  }

  const currentMedia = mediaList[currentMediaIndex] || {}

  return (
    <Layout>
      <Seo 
        title={artwork.title}
        description={artwork.description}
        image={artwork.main_image_url}
      />
      
      {/* 橫幅 */}
      <div className="artwork-banner">
        <div className="banner-content">
          <p>{artwork.project_year} 級 — {artwork.project_semester} 專題 — 期末 —</p>
        </div>
      </div>
      
      {/* 主要內容 */}
      <div className="artwork-container">
        <div className="artwork-grid">
          
          {/* 左側：媒體展示 */}
          <div className="media-section">
            {/* 主要媒體顯示 */}
            <div className="media-viewer">
              {mediaList.length > 0 && (
                <>
                  {currentMedia.type === 'image' ? (
                    <img
                      src={currentMedia.url}
                      alt={currentMedia.title}
                      className="media-image"
                    />
                  ) : currentMedia.embedUrl ? (
                    <iframe
                      src={currentMedia.embedUrl}
                      title={currentMedia.title}
                      className="media-video"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="media-error">
                      <p>無法載入影片</p>
                    </div>
                  )}
                  
                  {/* 導航按鈕 */}
                  {mediaList.length > 1 && (
                    <>
                      <button
                        onClick={() => navigateMedia('prev')}
                        className="nav-button nav-prev"
                        aria-label="上一個"
                      >
                        ←
                      </button>
                      <button
                        onClick={() => navigateMedia('next')}
                        className="nav-button nav-next"
                        aria-label="下一個"
                      >
                        →
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
            
            {/* 縮圖列表 */}
            {mediaList.length > 1 && (
              <div className="media-thumbnails">
                {mediaList.map((media, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentMediaIndex(index)}
                    className={`thumbnail ${index === currentMediaIndex ? 'active' : ''}`}
                  >
                    {media.type === 'image' ? (
                      <img src={media.url} alt={media.title} />
                    ) : (
                      <div className="video-thumb">
                        <span>▶</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* 右側：作品資訊 */}
          <div className="info-section">
            {/* 標題 */}
            <div className="artwork-header">
              <h1 className="artwork-title">{artwork.title}</h1>
              
              {/* 作者 */}
              <div className="artwork-authors">
                <span className="label">作者：</span>
                {artwork.authors && artwork.authors.length > 0 ? (
                  artwork.authors.map((author, index) => (
                    <span key={index}>
                      <Link to={`/author/${encodeURIComponent(author)}`} className="author-link">
                        {author}
                      </Link>
                      {index < artwork.authors.length - 1 && '、'}
                    </span>
                  ))
                ) : (
                  <Link to={`/author/${encodeURIComponent(artwork.author)}`} className="author-link">
                    {artwork.author}
                  </Link>
                )}
              </div>
              
              {/* 類別 */}
              {artwork.category_name && (
                <p className="artwork-category">
                  <span className="label">類別：</span>
                  {artwork.category_name}
                </p>
              )}
              
              {/* 年份 */}
              <p className="artwork-year">
                <span className="label">年代：</span>
                {artwork.year}
              </p>
            </div>
            
            {/* 標籤 */}
            {artwork.tags && artwork.tags.length > 0 && (
              <div className="artwork-tags">
                <h3 className="section-title">標籤</h3>
                <div className="tags-list">
                  {artwork.tags.map((tag, index) => (
                    <Link
                      key={index}
                      to={`/search?tags=${encodeURIComponent(tag)}`}
                      className="tag"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            {/* 作品簡介 */}
            <div className="artwork-description">
              <h3 className="section-title">作品簡介</h3>
              <p>{artwork.description}</p>
            </div>
            
            {/* 社群連結 */}
            {(artwork.social_links && artwork.social_links.length > 0) || artwork.social_link ? (
              <div className="artwork-links">
                <h3 className="section-title">🔗 連結</h3>
                <div className="links-list">
                  {artwork.social_links && artwork.social_links.length > 0 ? (
                    artwork.social_links.map((link, index) => (
                      <a
                        key={index}
                        href={link.includes('@') && !link.includes('http') 
                          ? `mailto:${link}`
                          : link.includes('http') 
                          ? link 
                          : `https://${link}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-link"
                      >
                        <span className="social-icon">{getSocialIcon(link)}</span>
                        <span>{getSocialPlatformName(link)}</span>
                      </a>
                    ))
                  ) : artwork.social_link ? (
                    <a
                      href={artwork.social_link.includes('@') && !artwork.social_link.includes('http') 
                        ? `mailto:${artwork.social_link}`
                        : artwork.social_link.includes('http') 
                        ? artwork.social_link 
                        : `https://${artwork.social_link}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                    >
                      <span className="social-icon">{getSocialIcon(artwork.social_link)}</span>
                      <span>查看更多</span>
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default ArtworkTemplate