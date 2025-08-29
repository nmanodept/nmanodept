// /src/pages/authors.jsx
import React, { useState, useEffect } from 'react'
import { Link } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import Loading from '../components/common/Loading'
import './authors.css'

const AuthorsPage = () => {
  const [authors, setAuthors] = useState([])
  const [filteredAuthors, setFilteredAuthors] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [authorProfiles, setAuthorProfiles] = useState({})
  
  useEffect(() => {
    fetchAuthors()
  }, [])
  
  useEffect(() => {
    filterAuthors()
  }, [searchTerm, authors])
  
  const fetchAuthors = async () => {
    setLoading(true)
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      
      // 使用新的 API endpoint 只獲取有作品的作者
      const response = await fetch(`${apiUrl}/authors-with-counts`)
      
      if (response.ok) {
        const data = await response.json()
        // 只顯示有作品的作者
        const authorsWithArtworks = data.filter(author => author.artwork_count > 0)
        setAuthors(authorsWithArtworks)
        setFilteredAuthors(authorsWithArtworks)
        
        // 收集有頭像的作者
        const profiles = {}
        authorsWithArtworks.forEach(author => {
          if (author.avatar_url) {
            profiles[author.name] = author.avatar_url
          }
        })
        setAuthorProfiles(profiles)
      } else {
        setError('無法載入作者列表')
      }
    } catch (error) {
      console.error('Failed to fetch authors:', error)
      setError('載入失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }
  
  const filterAuthors = () => {
    if (!searchTerm) {
      setFilteredAuthors(authors)
      return
    }
    
    const term = searchTerm.toLowerCase()
    const filtered = authors.filter(author => 
      author.name.toLowerCase().includes(term)
    )
    setFilteredAuthors(filtered)
  }
  
  const groupAuthorsByWorkCount = () => {
    const featured = []    // 作品數 >= 5
    const active = []      // 作品數 2-4
    const emerging = []    // 作品數 = 1
    
    filteredAuthors.forEach(author => {
      if (author.artwork_count >= 5) {
        featured.push(author)
      } else if (author.artwork_count >= 2) {
        active.push(author)
      } else {
        emerging.push(author)
      }
    })
    
    return { featured, active, emerging }
  }
  
  if (loading) {
    return (
      <Layout>
        <Seo title="創作者" />
        <Loading />
      </Layout>
    )
  }
  
  const groupedAuthors = groupAuthorsByWorkCount()
  
  return (
    <Layout>
      <Seo title="創作者" />
      <div className="authors-container">
        <div className="authors-header">
          <h1 className="authors-title">創作者</h1>
          <p className="authors-subtitle">
            共 {authors.length} 位創作者
          </p>
        </div>
        
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}
        
        <div className="authors-search">
          <input
            type="text"
            placeholder="搜尋創作者..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <svg className="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        {filteredAuthors.length === 0 ? (
          <div className="no-results">
            <p>找不到符合的創作者</p>
          </div>
        ) : (
          <div className="authors-content">
            {/* 精選創作者 */}
            {groupedAuthors.featured.length > 0 && (
              <section className="author-section">
                <h2 className="section-title">
                  <span className="accent-bar"></span>
                  精選創作者
                </h2>
                <div className="featured-authors">
                  {groupedAuthors.featured.map(author => (
                    <Link
                      key={author.id}
                      to={`/author/${encodeURIComponent(author.name)}`}
                      className="author-card featured"
                    >
                      <div className="author-avatar">
                        {authorProfiles[author.name] ? (
                          <img 
                            src={authorProfiles[author.name]} 
                            alt={author.name}
                            className="avatar-image"
                          />
                        ) : (
                          <div className="avatar-placeholder">
                            <span>{author.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                      <div className="author-info">
                        <h3 className="author-name">{author.name}</h3>
                        <p className="author-works">共 {author.artwork_count} 件作品</p>
                        {author.bio && (
                          <p className="author-bio">{author.bio}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            
            {/* 活躍創作者 */}
            {groupedAuthors.active.length > 0 && (
              <section className="author-section">
                <h2 className="section-title">
                  <span className="accent-bar"></span>
                  活躍創作者
                </h2>
                <div className="active-authors">
                  {groupedAuthors.active.map(author => (
                    <Link
                      key={author.id}
                      to={`/author/${encodeURIComponent(author.name)}`}
                      className="author-card-compact"
                    >
                      <div className="author-avatar-compact">
                        {authorProfiles[author.name] ? (
                          <img 
                            src={authorProfiles[author.name]} 
                            alt={author.name}
                            className="avatar-image-small"
                          />
                        ) : (
                          <div className="avatar-circle-small">
                            <span>{author.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                      <div className="author-info-compact">
                        <h3 className="author-name-small">{author.name}</h3>
                        <p className="author-works-small">共 {author.artwork_count} 件作品</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            
            {/* 新進創作者 */}
            {groupedAuthors.emerging.length > 0 && (
              <section className="author-section">
                <h2 className="section-title">
                  <span className="accent-bar"></span>
                  新進創作者
                </h2>
                <div className="emerging-list">
                  {groupedAuthors.emerging.map(author => (
                    <Link
                      key={author.id}
                      to={`/author/${encodeURIComponent(author.name)}`}
                      className="author-link"
                    >
                      <div className="author-link-content">
                        {authorProfiles[author.name] ? (
                          <img 
                            src={authorProfiles[author.name]} 
                            alt={author.name}
                            className="avatar-image-tiny"
                          />
                        ) : (
                          <div className="avatar-circle-tiny">
                            <span>{author.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        <span className="author-link-name">{author.name}</span>
                        <span className="author-link-count">({author.artwork_count})</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default AuthorsPage