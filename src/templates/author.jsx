import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import './author.css'

const AuthorTemplate = ({ pageContext }) => {
  const { author } = pageContext
  const [authorInfo, setAuthorInfo] = useState(null)
  const [artworks, setArtworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAuthorData = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.GATSBY_API_URL}/author/${encodeURIComponent(author)}`)
      if (!response.ok) throw new Error('無法載入作者資料')
      
      const data = await response.json()
      setAuthorInfo(data)
      
      const artworksWithDetails = await Promise.all(
        data.artworks.map(async (artwork) => ({
          ...artwork,
          tags: typeof artwork.tags === 'string' ? JSON.parse(artwork.tags || '[]') : artwork.tags || [],
          authors: typeof artwork.authors === 'string' ? JSON.parse(artwork.authors || '[]') : artwork.authors || []
        }))
      )
      
      // 按照學年度（現在是創作年份）排序
      artworksWithDetails.sort((a, b) => {
        const yearA = a.project_years?.[0] || a.project_year || 0
        const yearB = b.project_years?.[0] || b.project_year || 0
        return yearB - yearA // 新到舊
      })
      setArtworks(artworksWithDetails)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [author])

  useEffect(() => {
    fetchAuthorData()
  }, [fetchAuthorData])

  // 社交平台圖標組件
  const SocialIcon = ({ url }) => {
    const urlLower = url.toLowerCase()
    
    if (urlLower.includes('instagram.com')) {
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="2" width="16" height="16" rx="5" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="14.5" cy="5.5" r="1" fill="currentColor"/>
        </svg>
      )
    }
    
    if (urlLower.includes('github.com')) {
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 2C5.58 2 2 5.58 2 10c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0018 10c0-4.42-3.58-8-8-8z" fill="currentColor"/>
        </svg>
      )
    }
    
    if (urlLower.includes('behance.net')) {
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M7.5 7.5H3v5h4c1.38 0 2.5-1.12 2.5-2.5S8.88 7.5 7.5 7.5zM7 11H4.5V9H7c.55 0 1 .45 1 1s-.45 1-1 1z" fill="currentColor"/>
          <path d="M6.5 13H3v4h3.5c1.38 0 2.5-1.12 2.5-2.5S7.88 13 6.5 13zM6 15.5H4.5V14.5H6c.55 0 1 .45 1 1s-.45 1-1 1z" fill="currentColor"/>
          <path d="M11.5 7.5h5v1h-5zM14 9c-1.65 0-3 1.35-3 3s1.35 3 3 3c1.11 0 2.08-.61 2.6-1.5h-1.71c-.21.3-.59.5-1 .5-.83 0-1.5-.67-1.5-1.5h4.71c.06-.24.09-.49.09-.75 0-1.65-1.35-3-3-3zm-1.5 2c.17-.66.76-1.15 1.5-1.15s1.33.49 1.5 1.15h-3z" fill="currentColor"/>
        </svg>
      )
    }
    
    if (urlLower.includes('linkedin.com')) {
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M6 8v6M6 6v.01M10 14v-4c0-1 .5-2 2-2s2 1 2 2v4M10 8v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    }
    
    if (urlLower.includes('@') && !urlLower.includes('http')) {
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="5" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M3 7l7 4 7-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )
    }
    
    // 默認網站圖標
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M3 10h14M10 3c-1.5 2-2 4.5-2 7s.5 5 2 7M10 3c1.5 2 2 4.5 2 7s-.5 5-2 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  }

  const groupByYear = (artworks) => {
    const grouped = {}
    artworks.forEach(artwork => {
      // 使用學年度作為分組依據
      const year = artwork.project_years?.[0] || artwork.project_year || '未知'
      if (!grouped[year]) {
        grouped[year] = []
      }
      grouped[year].push(artwork)
    })
    return grouped
  }

  if (loading) {
    return (
      <Layout>
        <div className="author-loading">
          <div className="loading-spinner"></div>
          <p>載入中...</p>
        </div>
      </Layout>
    )
  }

  if (error || !authorInfo) {
    return (
      <Layout>
        <div className="author-error">
          <p>{error || '找不到作者'}</p>
          <Link to="/search" className="error-link">瀏覽所有作品</Link>
        </div>
      </Layout>
    )
  }

  const groupedArtworks = groupByYear(artworks)
  const years = Object.keys(groupedArtworks).sort((a, b) => b - a) // 新到舊

  return (
    <Layout>
      <Seo 
        title={`${decodeURIComponent(author)} 的作品 | 新沒系館`}
        description={authorInfo.bio || `新沒系館收錄的 ${decodeURIComponent(author)} 所有創作`}
        image={authorInfo.avatar_url}
      />

      
      <div className="author-container">
        {/* Hero Section - 新佈局 */}
        <section className="author-hero">
          <div className="hero-background">
            <div className="hero-gradient" />
            <div className="hero-pattern" />
          </div>
          
          {/* 新的橫向佈局 */}
          <div className="author-profile-horizontal">
            {/* 左側：大頭像 */}
            <div className="profile-avatar-large">
              {authorInfo.avatar_url ? (
                <img 
                  src={authorInfo.avatar_url} 
                  alt={decodeURIComponent(author)}
                  className="avatar-image-large"
                />
              ) : (
                <div className="avatar-placeholder-large">
                  <span>{decodeURIComponent(author).charAt(0).toUpperCase()}</span>
                </div>
              )}
              <div className="avatar-decoration" />
            </div>
            
            {/* 右側：作者資訊 */}
            <div className="profile-info-horizontal">
              <h1 className="author-name">{decodeURIComponent(author)}</h1>
              
              <div className="author-stats">
                <div className="stat-item">
                  <span className="stat-number">{artworks.length}</span>
                  <span className="stat-label">作品</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                  <span className="stat-number">{years.length}</span>
                  <span className="stat-label">創作年份</span>
                </div>
              </div>
              
              {authorInfo.bio && (
                <p className="author-bio">{authorInfo.bio}</p>
              )}
              
              {/* 社交連結 - 單行顯示 */}
              {authorInfo.social_links && authorInfo.social_links.length > 0 && (
                <div className="social-links-horizontal">
                  {authorInfo.social_links.map((link, index) => (
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
                      title={link}
                    >
                      <SocialIcon url={link} />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
        
        {/* 作品展示區 */}
        <section className="artworks-section">
          {artworks.length === 0 ? (
            <div className="empty-state">
              <p>目前沒有此作者的作品</p>
              <Link to="/search">
                <Button variant="ghost">瀏覽其他作品</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="section-header">
                <h2>作品集</h2>
                <div className="header-line" />
              </div>
              
              {/* 時間線 */}
              <div className="timeline-container">
                {years.map((year, yearIndex) => (
                  <div key={year} className="timeline-year">
                    {/* 年份標記 */}
                    <div className="year-marker">
                      <div className="year-badge">
                        <span>{year}</span>
                      </div>
                      <div className="year-line" />
                    </div>
                    
                    {/* 作品網格 */}
                    <div className="year-artworks">
                      <div className="artworks-grid">
                        {groupedArtworks[year].map(artwork => (
                          <Card
                            key={artwork.id}
                            artwork={artwork}
                            link={`/art/${artwork.id}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </Layout>
  )
}

export default AuthorTemplate