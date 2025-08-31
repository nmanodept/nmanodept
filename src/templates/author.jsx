// /src/templates/author.jsx - 完整修復版
import React, { useState, useEffect } from 'react'
import { Link } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import Card from '../components/common/Card'
import Loading from '../components/common/Loading'
import './author.css'

const AuthorTemplate = ({ pageContext }) => {
  const { author: authorName } = pageContext
  const [author, setAuthor] = useState(null)
  const [artworks, setArtworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('grid')
  const [sortBy, setSortBy] = useState('newest')
  
  useEffect(() => {
    fetchAuthorData()
  }, [authorName])
  
  const fetchAuthorData = async () => {
    setLoading(true)
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      
      // 獲取作者資訊
      const authorsResponse = await fetch(`${apiUrl}/authors`)
      if (authorsResponse.ok) {
        const authorsData = await authorsResponse.json()
        const authorInfo = authorsData.find(a => a.name === authorName)
        setAuthor(authorInfo)
      }
      
      // 獲取所有作品並篩選該作者的作品
      const artworksResponse = await fetch(`${apiUrl}/artworks`)
      if (artworksResponse.ok) {
        const allArtworks = await artworksResponse.json()
        
        // 處理並篩選作品
        const authorArtworks = allArtworks.filter(artwork => {
          const authors = Array.isArray(artwork.authors) ? artwork.authors :
                          typeof artwork.authors === 'string' ? JSON.parse(artwork.authors || '[]') : []
          return authors.includes(authorName)
        }).map(artwork => ({
          ...artwork,
          tags: Array.isArray(artwork.tags) ? artwork.tags :
                typeof artwork.tags === 'string' ? JSON.parse(artwork.tags || '[]') : [],
          authors: Array.isArray(artwork.authors) ? artwork.authors :
                   typeof artwork.authors === 'string' ? JSON.parse(artwork.authors || '[]') : [],
          categories: Array.isArray(artwork.categories) ? artwork.categories :
                      typeof artwork.categories === 'string' ? JSON.parse(artwork.categories || '[]') : []
        }))
        
        // 預設按最新排序
        authorArtworks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        
        setArtworks(authorArtworks)
      }
    } catch (error) {
      console.error('Failed to fetch author data:', error)
      setError('載入失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }
  
  // 排序作品
  const sortArtworks = (method) => {
    setSortBy(method)
    const sorted = [...artworks]
    
    switch (method) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        break
      case 'oldest':
        sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        break
      case 'year':
        sorted.sort((a, b) => (b.project_year || 0) - (a.project_year || 0))
        break
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title, 'zh-TW'))
        break
      default:
        break
    }
    
    setArtworks(sorted)
  }
  
  if (loading) {
    return (
      <Layout>
        <Seo title={`${authorName} - 創作者`} />
        <Loading />
      </Layout>
    )
  }
  
  if (!author && artworks.length === 0) {
    return (
      <Layout>
        <Seo title="找不到創作者" />
        <div className="error-container">
          <h1>找不到創作者</h1>
          <p>無法找到名為 "{authorName}" 的創作者</p>
          <Link to="/authors" className="btn btn-primary">
            返回創作者列表
          </Link>
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
    
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M11 3H3v14h14v-8m0-6l-8 8m4-8h4v4" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    )
  }
  
  const getSocialName = (url) => {
    const urlLower = url.toLowerCase()
    if (urlLower.includes('instagram')) return 'Instagram'
    if (urlLower.includes('github')) return 'GitHub'
    if (urlLower.includes('behance')) return 'Behance'
    return '外部連結'
  }
  
  return (
    <Layout>
      <Seo 
        title={`${authorName} - 創作者`}
        description={author?.bio || `查看 ${authorName} 的作品集`}
      />
      
      <div className="author-page-container">
        {/* 作者資訊區 */}
        <div className="author-hero">
          <div className="author-hero-content">
            <div className="author-avatar-large">
              {author?.avatar_url ? (
                <img src={author.avatar_url} alt={authorName} />
              ) : (
                <div className="avatar-placeholder-large">
                  <span>{authorName.charAt(0)}</span>
                </div>
              )}
            </div>
            
            <div className="author-details">
              <h1 className="author-name-large">{authorName}</h1>
              
              {author?.bio && (
                <p className="author-bio-large">{author.bio}</p>
              )}
              
              <div className="author-stats-large">
                <div className="stat-item">
                  <span className="stat-value">{artworks.length}</span>
                  <span className="stat-label">作品</span>
                </div>
                
                {author?.graduation_year && (
                  <div className="stat-item">
                    <span className="stat-value">{author.graduation_year}</span>
                    <span className="stat-label">畢業年份</span>
                  </div>
                )}
              </div>
              
              {author?.social_links && author.social_links.length > 0 && (
                <div className="author-social-links">
                  {author.social_links.map((link, index) => (
                    <a
                      key={index}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link-btn"
                      aria-label={getSocialName(link)}
                    >
                      {getSocialIcon(link)}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 作品區 */}
        <div className="author-works">
          <div className="works-header">
            <h2>作品集</h2>
            
            <div className="works-controls">
              <select 
                value={sortBy}
                onChange={(e) => sortArtworks(e.target.value)}
                className="sort-select"
              >
                <option value="newest">最新作品</option>
                <option value="oldest">最舊作品</option>
                <option value="year">創作年份</option>
                <option value="title">作品名稱</option>
              </select>
              
              <div className="view-tabs">
                <button
                  className={`tab-btn ${activeTab === 'grid' ? 'active' : ''}`}
                  onClick={() => setActiveTab('grid')}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="1" y="1" width="6" height="6"/>
                    <rect x="9" y="1" width="6" height="6"/>
                    <rect x="1" y="9" width="6" height="6"/>
                    <rect x="9" y="9" width="6" height="6"/>
                  </svg>
                  網格
                </button>
                <button
                  className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
                  onClick={() => setActiveTab('list')}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="1" y="2" width="14" height="2"/>
                    <rect x="1" y="7" width="14" height="2"/>
                    <rect x="1" y="12" width="14" height="2"/>
                  </svg>
                  列表
                </button>
              </div>
            </div>
          </div>
          
          {artworks.length > 0 ? (
            activeTab === 'grid' ? (
              <div className="works-grid">
                {artworks.map(artwork => (
                  <Card
                    key={artwork.id}
                    artwork={artwork}
                    link={`/art/${artwork.id}`}
                  />
                ))}
              </div>
            ) : (
              <div className="works-list">
                {artworks.map(artwork => (
                  <Link
                    key={artwork.id}
                    to={`/art/${artwork.id}`}
                    className="work-list-item"
                  >
                    <div className="work-list-image">
                      <img 
                        src={artwork.main_image_url || '/images/placeholder.jpg'} 
                        alt={artwork.title}
                      />
                    </div>
                    
                    <div className="work-list-info">
                      <h3>{artwork.title}</h3>
                      
                      <div className="work-meta">
                        {artwork.project_year && (
                          <span className="work-year">{artwork.project_year}</span>
                        )}
                        
                        {artwork.categories && artwork.categories.length > 0 && (
                          <span className="work-category">
                            {typeof artwork.categories[0] === 'object' 
                              ? artwork.categories[0].name 
                              : artwork.categories[0]}
                          </span>
                        )}
                      </div>
                      
                      {artwork.description && (
                        <p className="work-description">
                          {artwork.description.length > 150 
                            ? `${artwork.description.substring(0, 150)}...`
                            : artwork.description}
                        </p>
                      )}
                      
                      {artwork.tags && artwork.tags.length > 0 && (
                        <div className="work-tags">
                          {artwork.tags.slice(0, 5).map((tag, index) => (
                            <span key={index} className="work-tag">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )
          ) : (
            <div className="empty-works">
              <p>尚無作品</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default AuthorTemplate