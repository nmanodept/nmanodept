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
      
      artworksWithDetails.sort((a, b) => a.year - b.year)
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
    return '網站'
  }

  const groupByYear = (artworks) => {
    const grouped = {}
    artworks.forEach(artwork => {
      const year = artwork.year
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
  const years = Object.keys(groupedArtworks).sort((a, b) => a - b)

  return (
    <Layout>
      <Seo 
        title={`${decodeURIComponent(author)} 的作品`}
        description={authorInfo.bio || `瀏覽 ${decodeURIComponent(author)} 的所有創作`}
        image={authorInfo.avatar_url}
      />
      
      <div className="author-container">
        {/* 作者資訊區 */}
        <div className="author-info-card">
          <div className="author-info-content">
            {/* 頭像 */}
            <div className="author-avatar">
              {authorInfo.avatar_url ? (
                <img 
                  src={authorInfo.avatar_url} 
                  alt={decodeURIComponent(author)}
                  className="avatar-image"
                />
              ) : (
                <div className="avatar-placeholder">
                  <span>{decodeURIComponent(author).charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
            
            {/* 作者資訊 */}
            <div className="author-details">
              <h1 className="author-name">{decodeURIComponent(author)}</h1>
              <p className="author-stats">共 {artworks.length} 件作品</p>
              
              {/* 個人簡介 */}
              {authorInfo.bio ? (
                <div className="author-bio">
                  <p>{authorInfo.bio}</p>
                </div>
              ) : (
                <div className="author-bio empty">
                  <p>尚未提供個人簡介</p>
                </div>
              )}
              
              {/* 社交連結 */}
              {authorInfo.social_links && authorInfo.social_links.length > 0 && (
                <div className="author-social">
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
                      <span className="social-icon">{getSocialIcon(link)}</span>
                      <span>{getSocialPlatformName(link)}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 作品展示區 */}
        {artworks.length === 0 ? (
          <div className="empty-state">
            <p>目前沒有此作者的作品</p>
            <Link to="/search">
              <Button variant="ghost">瀏覽其他作品</Button>
            </Link>
          </div>
        ) : (
          <div className="artworks-section">
            <h2 className="section-header">作品時間線</h2>
            
            <div className="timeline">
              {years.map((year, yearIndex) => (
                <div key={year} className="timeline-year">
                  {/* 時間線連接線 */}
                  {yearIndex !== 0 && <div className="timeline-connector top" />}
                  {yearIndex !== years.length - 1 && <div className="timeline-connector bottom" />}
                  
                  {/* 年份標記 */}
                  <div className="year-marker">
                    <div className="year-dot">
                      <span>{year}</span>
                    </div>
                    <div className="year-info">
                      <h3>{year} 年作品</h3>
                      <p>{groupedArtworks[year].length} 件</p>
                    </div>
                  </div>
                  
                  {/* 該年份的作品 */}
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
          </div>
        )}
        
        {/* 返回按鈕 */}
        <div className="page-footer">
          <Link to="/authors">
            <Button variant="ghost">瀏覽更多作者</Button>
          </Link>
        </div>
      </div>
    </Layout>
  )
}

export default AuthorTemplate