// /src/templates/artwork.jsx
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

  // 社交平台圖標組件
  const SocialIcon = ({ url }) => {
    const urlLower = url.toLowerCase()
    
    if (urlLower.includes('instagram.com')) {
      return (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="2" width="16" height="16" rx="5" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="14.5" cy="5.5" r="1" fill="currentColor"/>
        </svg>
      )
    }
    
    if (urlLower.includes('github.com')) {
      return (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path d="M10 2C5.58 2 2 5.58 2 10c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0018 10c0-4.42-3.58-8-8-8z" fill="currentColor"/>
        </svg>
      )
    }
    
    if (urlLower.includes('behance.net')) {
      return (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path d="M7.5 7.5H3v5h4c1.38 0 2.5-1.12 2.5-2.5S8.88 7.5 7.5 7.5zM7 11H4.5V9H7c.55 0 1 .45 1 1s-.45 1-1 1z" fill="currentColor"/>
          <path d="M6.5 13H3v4h3.5c1.38 0 2.5-1.12 2.5-2.5S7.88 13 6.5 13zM6 15.5H4.5V14.5H6c.55 0 1 .45 1 1s-.45 1-1 1z" fill="currentColor"/>
          <path d="M11.5 7.5h5v1h-5zM14 9c-1.65 0-3 1.35-3 3s1.35 3 3 3c1.11 0 2.08-.61 2.6-1.5h-1.71c-.21.3-.59.5-1 .5-.83 0-1.5-.67-1.5-1.5h4.71c.06-.24.09-.49.09-.75 0-1.65-1.35-3-3-3zm-1.5 2c.17-.66.76-1.15 1.5-1.15s1.33.49 1.5 1.15h-3z" fill="currentColor"/>
        </svg>
      )
    }
    
    if (urlLower.includes('linkedin.com')) {
      return (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M6 8v6M6 6v.01M10 14v-4c0-1 .5-2 2-2s2 1 2 2v4M10 8v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    }
    
    if (urlLower.includes('@') && !urlLower.includes('http')) {
      return (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="5" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M3 7l7 4 7-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )
    }
    
    // 默認連結圖標
    return (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path d="M11 7H6c-1.65 0-3 1.35-3 3s1.35 3 3 3h5M9 13h5c1.65 0 3-1.35 3-3s-1.35-3-3-3H9M7 10h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
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

  // 處理專題資訊顯示
  const projectYears = artwork.project_years || (artwork.project_year ? [artwork.project_year] : [])
  const projectSemesters = artwork.project_semesters || (artwork.project_semester ? [artwork.project_semester] : [])

  return (
    <Layout>
      <Seo 
        title={`${artwork.title} | 新沒系館 NMANODEPT`}
        description={artwork.description || `新沒系館收錄的 ${artwork.title}，作者：${(artwork.authors && artwork.authors.length > 0 ? artwork.authors.join('、') : artwork.author)}。`}
        image={artwork.main_image_url}
      />
      
      <div className="artwork-page">
        {/* 頂部資訊條 */}
        <div className="artwork-topbar">
          <div className="topbar-content">
            <span className="topbar-text">
              {projectYears.map((year, index) => (
                <span key={index}>
                  {year} 
                  {index < projectYears.length - 1 && '、'}
                </span>
              ))}
              {' — '}
              {projectSemesters.map((semester, index) => (
                <span key={index}>
                  {semester}
                  {index < projectSemesters.length - 1 && '、'}
                </span>
              ))}
              {' 專題'}
            </span>
          </div>
        </div>
        
        {/* 主要內容區 */}
        <div className="artwork-container">
          {/* 左側：媒體展示 */}
          <div className="media-section">
            <div className="media-wrapper">
              {/* 主要媒體顯示 */}
              <div className="media-viewer">
                {mediaList.length > 0 && (
                  <>
                    {currentMedia.type === 'image' ? (
                      <img
                        src={currentMedia.url}
                        alt={currentMedia.title}
                        className="media-content"
                      />
                    ) : currentMedia.embedUrl ? (
                      <iframe
                        src={currentMedia.embedUrl}
                        title={currentMedia.title}
                        className="media-content video-frame"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div className="media-error">
                        <p>無法載入影片</p>
                      </div>
                    )}
                  </>
                )}
                
                {/* 導航按鈕 */}
                {mediaList.length > 1 && (
                  <>
                    <button
                      onClick={() => navigateMedia('prev')}
                      className="nav-button nav-prev"
                      aria-label="上一個"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => navigateMedia('next')}
                      className="nav-button nav-next"
                      aria-label="下一個"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </>
                )}
              </div>
              
              {/* 縮圖列表 */}
              {mediaList.length > 1 && (
                <div className="media-thumbnails">
                  <div className="thumbnails-track">
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
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                              <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/>
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* 右側：作品資訊 */}
          <div className="info-section">
            {/* 標題區塊 */}
            <div className="artwork-header">
              <h1 className="artwork-title">{artwork.title}</h1>
              
              {/* 標籤 - 移到標題下方 */}
              {artwork.tags && artwork.tags.length > 0 && (
                <div className="tags-section">
                  <div className="tags-list">
                    {artwork.tags.map((tag, index) => (
                      <Link
                        key={index}
                        to={`/search?tags=${encodeURIComponent(tag)}`}
                        className="tag-link"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 元數據 */}
              <div className="artwork-metadata">
                <div className="meta-item">
                  <span className="meta-label">作者</span>
                  <span className="meta-value">
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
                  </span>
                </div>
                
                {/* 類別 - 支援多類別 */}
                {((artwork.categories && artwork.categories.length > 0) || artwork.category_name) && (
                  <div className="meta-item">
                    <span className="meta-label">類別</span>
                    <span className="meta-value">
                      {artwork.categories && artwork.categories.length > 0 ? (
                        artwork.categories.map((category, index) => (
                          <span key={index}>
                            <Link 
                              to={`/search?categories=${category.id}`} 
                              className="category-link"
                            >
                              {category.name}
                            </Link>
                            {index < artwork.categories.length - 1 && '、'}
                          </span>
                        ))
                      ) : (
                        <Link 
                          to={`/search?categories=${artwork.category_id}`} 
                          className="category-link"
                        >
                          {artwork.category_name}
                        </Link>
                      )}
                    </span>
                  </div>
                )}
                
                <div className="meta-item">
                  <span className="meta-label">年份</span>
                  <span className="meta-value">{artwork.project_year}</span>
                </div>
              </div>
            </div>
            
            {/* 作品簡介 */}
            <div className="description-section">
              <h2 className="section-title">作品簡介</h2>
              <p className="description-text">{artwork.description}</p>
            </div>
            
            {/* 連結 */}
            {(artwork.social_links && artwork.social_links.length > 0) || artwork.social_link ? (
              <div className="links-section">
                <h2 className="section-title">相關連結</h2>
                <div className="links-grid">
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
                        className="link-item"
                      >
                        <SocialIcon url={link} />
                        <span className="link-text">{getSocialPlatformName(link)}</span>
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
                      className="link-item"
                    >
                      <SocialIcon url={artwork.social_link} />
                      <span className="link-text">查看更多</span>
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
  
  function getSocialPlatformName(url) {
    if (!url) return '連結'
    
    const urlLower = url.toLowerCase()
    if (urlLower.includes('instagram.com')) return 'Instagram'
    if (urlLower.includes('github.com')) return 'GitHub'
    if (urlLower.includes('behance.net')) return 'Behance'
    if (urlLower.includes('dribbble.com')) return 'Dribbble'
    if (urlLower.includes('linkedin.com')) return 'LinkedIn'
    if (urlLower.includes('@') && !urlLower.includes('http')) return 'Email'
    return '外部連結'
  }
}

export default ArtworkTemplate