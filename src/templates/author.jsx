// /src/templates/author.jsx
import React, { useState, useEffect } from 'react'
import { Link } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import Loading from '../components/common/Loading'
import './author.css'

const AuthorTemplate = ({ pageContext }) => {
  const { author: authorName } = pageContext
  const [author, setAuthor] = useState(null)
  const [artworks, setArtworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('grid')
  
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
      
      // 獲取所有作品
      const artworksResponse = await fetch(`${apiUrl}/artworks`)
      if (artworksResponse.ok) {
        const allArtworks = await artworksResponse.json()
        // 篩選該作者的作品
        const authorArtworks = allArtworks.filter(artwork => 
          artwork.authors && artwork.authors.includes(authorName)
        )
        setArtworks(authorArtworks)
      }
    } catch (error) {
      console.error('Failed to fetch author data:', error)
      setError('載入失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
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
                <img 
                  src={author.avatar_url} 
                  alt={authorName}
                  className="avatar-image-large"
                />
              ) : (
                <div className="avatar-placeholder-large">
                  <span>{authorName.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
            
            <div className="author-details">
              <h1 className="author-title">{authorName}</h1>
              <p className="author-stats">
                {artworks.length} 件作品
              </p>
              
              {author?.bio && (
                <p className="author-bio-full">{author.bio}</p>
              )}
              
              {/* 社交媒體連結 */}
              {author && (author.website || author.instagram || author.behance || author.facebook || author.youtube) && (
                <div className="author-social-links">
                  {author.website && (
                    <a 
                      href={author.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="social-link"
                      aria-label="Website"
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm6.93 6h-2.95a15.65 15.65 0 00-1.38-3.56A8.03 8.03 0 0116.93 6zM10 2.04c.83 1.2 1.48 2.53 1.91 3.96H8.09c.43-1.43 1.08-2.76 1.91-3.96zM2.26 12C2.1 11.36 2 10.69 2 10s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2H2.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.987 7.987 0 013.08 14zm2.95-8H3.08a7.987 7.987 0 014.33-3.56A15.65 15.65 0 006.03 6zM10 17.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM12.34 12H7.66c-.09-.66-.16-1.32-.16-2s.07-1.35.16-2h4.68c.09.65.16 1.32.16 2s-.07 1.34-.16 2zm.56 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 01-4.33 3.56zM14.36 12c.08-.66.14-1.32.14-2s-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/>
                      </svg>
                    </a>
                  )}
                  {author.instagram && (
                    <a 
                      href={`https://instagram.com/${author.instagram.replace('@', '')}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="social-link"
                      aria-label="Instagram"
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 1.802c2.67 0 2.987.01 4.042.059 2.71.123 3.975 1.409 4.099 4.099.048 1.054.057 1.37.057 4.04 0 2.672-.01 2.988-.057 4.042-.124 2.687-1.387 3.975-4.1 4.099-1.054.048-1.37.058-4.041.058-2.67 0-2.987-.01-4.04-.058-2.717-.124-3.977-1.416-4.1-4.1-.048-1.054-.058-1.37-.058-4.041 0-2.67.01-2.986.058-4.04.124-2.69 1.387-3.977 4.1-4.1 1.054-.048 1.37-.058 4.04-.058zM10 0C7.284 0 6.944.012 5.878.06 2.246.227.228 2.242.06 5.877.01 6.944 0 7.284 0 10s.012 3.057.06 4.123c.167 3.632 2.182 5.65 5.817 5.817 1.067.048 1.407.06 4.123.06s3.057-.012 4.123-.06c3.629-.167 5.652-2.182 5.816-5.817.05-1.066.061-1.407.061-4.123s-.012-3.056-.06-4.122C19.777 2.249 17.76.228 14.124.06 13.057.01 12.716 0 10 0zm0 4.865a5.135 5.135 0 100 10.27 5.135 5.135 0 000-10.27zm0 8.468a3.333 3.333 0 110-6.666 3.333 3.333 0 010 6.666zm5.338-9.87a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z"/>
                      </svg>
                    </a>
                  )}
                  {author.behance && (
                    <a 
                      href={`https://behance.net/${author.behance}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="social-link"
                      aria-label="Behance"
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8.072 6.784s1.52-.113 1.52-1.896c0-1.783-1.243-2.653-2.819-2.653H0v15.408h6.773s3.165.1 3.165-2.94c0 0 .138-2.919-1.866-2.919zm-5.04-1.973h3.741s.705 0 .705.875-.414.999-.886.999H3.032V4.811zm3.56 7.833H3.032V9.49h3.741s1.051-.013 1.051 1.367c0 1.168-.696 1.775-1.232 1.787zM15.197 5.654c-3.833 0-3.829 3.829-3.829 3.829s-.263 3.808 3.829 3.808c0 0 3.415.195 3.415-2.653h-1.759s.058 1.073-1.601 1.073c0 0-1.759.117-1.759-1.738h5.174s.566-4.319-3.47-4.319zm1.392 2.997h-3.264s.215-1.538 1.759-1.538 1.505 1.538 1.505 1.538zM16.764 2.95h-4.099v1.248h4.099V2.95z"/>
                      </svg>
                    </a>
                  )}
                  {author.facebook && (
                    <a 
                      href={`https://facebook.com/${author.facebook}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="social-link"
                      aria-label="Facebook"
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M20 10.061C20 4.505 15.523 0 10 0S0 4.505 0 10.061c0 5.022 3.657 9.184 8.438 9.939v-7.03h-2.54v-2.91h2.54V7.845c0-2.522 1.492-3.915 3.777-3.915 1.094 0 2.238.197 2.238.197v2.476h-1.26c-1.243 0-1.63.775-1.63 1.57v1.888h2.773l-.443 2.91h-2.33V20c4.78-.755 8.437-4.917 8.437-9.939z"/>
                      </svg>
                    </a>
                  )}
                  {author.youtube && (
                    <a 
                      href={`https://youtube.com/@${author.youtube}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="social-link"
                      aria-label="YouTube"
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M19.582 5.187s-.195-1.378-.795-1.985c-.76-.796-1.613-.8-2.004-.847C14.005 2.16 10.002 2.16 10.002 2.16h-.008s-4.003 0-6.782.195c-.39.047-1.243.051-2.004.847-.6.607-.794 1.985-.794 1.985S0 6.796 0 8.404v1.508c0 1.608.21 3.217.21 3.217s.205 1.378.794 1.985c.76.796 1.76.77 2.205.854 1.6.153 6.593.201 6.593.201s4.007-.006 6.785-.201c.391-.047 1.244-.051 2.004-.847.6-.607.795-1.985.795-1.985s.21-1.609.21-3.217V8.411c-.002-1.608-.212-3.217-.212-3.217l.198-.007zM7.932 12.594V6.333l5.403 3.14-5.403 3.121z"/>
                      </svg>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 作品展示區 */}
        <div className="author-artworks">
          <div className="artworks-header">
            <h2 className="artworks-title">作品集</h2>
            <div className="view-tabs">
              <button
                className={`tab-btn ${activeTab === 'grid' ? 'active' : ''}`}
                onClick={() => setActiveTab('grid')}
              >
                網格視圖
              </button>
              <button
                className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
                onClick={() => setActiveTab('list')}
              >
                列表視圖
              </button>
            </div>
          </div>
          
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}
          
          {artworks.length === 0 ? (
            <div className="no-artworks">
              <p>尚無作品</p>
            </div>
          ) : (
            <div className={`artworks-${activeTab}`}>
              {artworks.map(artwork => (
                <Link
                  key={artwork.id}
                  to={`/art/${artwork.id}`}
                  className={`artwork-item ${activeTab}`}
                >
                  <div className="artwork-image-container">
                    <img 
                      src={artwork.main_image_url || '/images/placeholder.jpg'} 
                      alt={artwork.title}
                      className="artwork-image"
                    />
                    {artwork.requires_disclaimer && (
                      <div className="artwork-badge">需確認</div>
                    )}
                  </div>
                  <div className="artwork-info">
                    <h3 className="artwork-title">{artwork.title}</h3>
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
                    {activeTab === 'list' && artwork.description && (
                      <p className="artwork-description">
                        {artwork.description.length > 150 
                          ? artwork.description.substring(0, 150) + '...'
                          : artwork.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default AuthorTemplate