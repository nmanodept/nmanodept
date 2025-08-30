// /src/templates/artwork.jsx - 完整修復版
import React, { useState, useEffect } from 'react'
import { Link } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import Loading from '../components/common/Loading'
import Button from '../components/common/Button'
import './artwork.css'

const ArtworkTemplate = ({ pageContext, location }) => {
  const { id, artwork: initialArtwork } = pageContext
  const [artwork, setArtwork] = useState(initialArtwork || null)
  const [loading, setLoading] = useState(!initialArtwork)
  const [error, setError] = useState(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [showVideoPlayer, setShowVideoPlayer] = useState(false)
  
  useEffect(() => {
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
      
      // 處理資料格式
      const processedData = {
        ...data,
        tags: Array.isArray(data.tags) ? data.tags : 
              typeof data.tags === 'string' ? JSON.parse(data.tags || '[]') : [],
        authors: Array.isArray(data.authors) ? data.authors :
                 typeof data.authors === 'string' ? JSON.parse(data.authors || '[]') : [],
        categories: Array.isArray(data.categories) ? data.categories :
                    typeof data.categories === 'string' ? JSON.parse(data.categories || '[]') : [],
        social_links: Array.isArray(data.social_links) ? data.social_links :
                      typeof data.social_links === 'string' ? JSON.parse(data.social_links || '[]') : [],
        gallery_images: data.gallery_images || [],
        gallery_videos: data.gallery_videos || []
      }
      
      setArtwork(processedData)
    } catch (err) {
      console.error('Fetch error:', err)
      setError('載入作品時發生錯誤')
    } finally {
      setLoading(false)
    }
  }
  
  // 處理影片 URL（支援 YouTube 和 Vimeo）
  const getVideoEmbedUrl = (url) => {
    if (!url) return null
    
    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.includes('youtu.be') 
        ? url.split('/').pop()
        : url.split('v=')[1]?.split('&')[0]
      return `https://www.youtube.com/embed/${videoId}`
    }
    
    // Vimeo
    if (url.includes('vimeo.com')) {
      const videoId = url.split('/').pop()
      return `https://player.vimeo.com/video/${videoId}`
    }
    
    return url
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
  const authorNames = artwork.authors?.join(' 、 ') || artwork.author || '未知作者'
  const allImages = [
    { url: artwork.main_image_url, type: 'main' },
    ...(artwork.gallery_images || []).map(img => ({
      url: img.url || img.image_url,
      type: 'gallery'
    }))
  ]
  
  const currentImage = allImages[activeImageIndex]
  const videoEmbedUrl = getVideoEmbedUrl(artwork.video_url)
  
  return (
    <Layout>
      <Seo 
        title={artwork.title}
        description={artwork.description}
        image={artwork.main_image_url}
      />
      
      <div className="artwork-container">
        <div className="artwork-main">
          {/* 主要圖片/影片區域 */}
          <div className="artwork-media">
            {/* 主圖片顯示 */}
            {currentImage && !showVideoPlayer && (
              <div className="artwork-image-container">
                <img 
                  src={currentImage.url} 
                  alt={artwork.title}
                  className="artwork-main-image"
                />
                
                {/* 影片播放按鈕 */}
                {videoEmbedUrl && activeImageIndex === 0 && (
                  <button 
                    className="video-play-button"
                    onClick={() => setShowVideoPlayer(true)}
                    aria-label="播放影片"
                  >
                    <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                      <circle cx="30" cy="30" r="30" fill="rgba(0, 0, 0, 0.7)"/>
                      <path d="M24 20L40 30L24 40V20Z" fill="white"/>
                    </svg>
                  </button>
                )}
              </div>
            )}
            
            {/* 影片播放器 */}
            {showVideoPlayer && videoEmbedUrl && (
              <div className="artwork-video-container">
                <button 
                  className="video-close-button"
                  onClick={() => setShowVideoPlayer(false)}
                >
                  ✕
                </button>
                <iframe
                  src={videoEmbedUrl}
                  title={`${artwork.title} 影片`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="artwork-video-iframe"
                />
              </div>
            )}
            
            {/* 圖片縮圖列表 */}
            {allImages.length > 1 && (
              <div className="artwork-thumbnails">
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    className={`thumbnail ${index === activeImageIndex ? 'active' : ''}`}
                    onClick={() => {
                      setActiveImageIndex(index)
                      setShowVideoPlayer(false)
                    }}
                  >
                    <img src={img.url} alt={`${artwork.title} ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
            
            {/* Gallery 影片連結 */}
            {artwork.gallery_videos && artwork.gallery_videos.length > 0 && (
              <div className="gallery-videos">
                <h3>相關影片</h3>
                <div className="video-links">
                  {artwork.gallery_videos.map((video, index) => (
                    <a 
                      key={index}
                      href={video.url || video.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="video-link"
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M4 4L16 10L4 16V4Z"/>
                      </svg>
                      影片 {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* 作品資訊 */}
          <div className="artwork-info">
            <h1 className="artwork-title">{artwork.title}</h1>
            
            {/* 作者資訊 */}
            <div className="artwork-authors">
              <span className="info-label">創作者</span>
              <div className="author-links">
                {artwork.authors?.map((author, index) => (
                  <React.Fragment key={author}>
                    <Link to={`/author/${encodeURIComponent(author)}`} className="author-link">
                      {author}
                    </Link>
                    {index < artwork.authors.length - 1 && <span className="separator">、</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
            
            {/* 創作年份 */}
            {artwork.project_year && (
              <div className="artwork-year">
                <span className="info-label">創作年份</span>
                <span className="info-value">{artwork.project_year}</span>
              </div>
            )}
            
            {/* 年級學期 */}
            {artwork.project_semester && (
              <div className="artwork-semester">
                <span className="info-label">年級學期</span>
                <span className="info-value">{artwork.project_semester}</span>
              </div>
            )}
            
            {/* 類別 */}
            {artwork.categories && artwork.categories.length > 0 && (
              <div className="artwork-categories">
                <span className="info-label">類別</span>
                <div className="category-tags">
                  {artwork.categories.map((category, index) => (
                    <span key={index} className="category-tag">
                      {typeof category === 'object' ? category.name : category}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* 標籤 */}
            {artwork.tags && artwork.tags.length > 0 && (
              <div className="artwork-tags">
                <span className="info-label">標籤</span>
                <div className="tags-list">
                  {artwork.tags.map((tag, index) => (
                    <Link 
                      key={index}
                      to={`/search?tags=${encodeURIComponent(tag)}`}
                      className="tag-link"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            {/* 作品描述 */}
            {artwork.description && (
              <div className="artwork-description">
                <h2>作品說明</h2>
                <div className="description-content">
                  {artwork.description.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </div>
            )}
            
            {/* 社交連結 */}
            {artwork.social_links && artwork.social_links.length > 0 && (
              <div className="artwork-social">
                <h3>相關連結</h3>
                <div className="social-links">
                  {artwork.social_links.map((link, index) => (
                    <a 
                      key={index}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                    >
                      {getSocialIcon(link)}
                      <span>{getSocialName(link)}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* 返回按鈕 */}
        <div className="artwork-actions">
          <Link to="/search" className="btn-back">
            ← 返回搜尋
          </Link>
        </div>
      </div>
    </Layout>
  )
}

// 社交媒體圖標
const getSocialIcon = (url) => {
  const urlLower = url.toLowerCase()
  
  if (urlLower.includes('instagram')) {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <rect x="2" y="2" width="16" height="16" rx="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <circle cx="14.5" cy="5.5" r="1" fill="currentColor"/>
      </svg>
    )
  }
  
  if (urlLower.includes('github')) {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 2C5.58 2 2 5.58 2 10c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0018 10c0-4.42-3.58-8-8-8z"/>
      </svg>
    )
  }
  
  // 預設連結圖標
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M11 3H3v14h14v-8m0-6l-8 8m4-8h4v4" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}

// 獲取社交媒體名稱
const getSocialName = (url) => {
  const urlLower = url.toLowerCase()
  if (urlLower.includes('instagram')) return 'Instagram'
  if (urlLower.includes('github')) return 'GitHub'
  if (urlLower.includes('behance')) return 'Behance'
  if (urlLower.includes('youtube')) return 'YouTube'
  if (urlLower.includes('vimeo')) return 'Vimeo'
  return '外部連結'
}

export default ArtworkTemplate