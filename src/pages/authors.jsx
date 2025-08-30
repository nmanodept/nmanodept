// /src/pages/authors.jsx - 修正版本
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
      
      // 先嘗試使用 authors-with-counts，如果失敗則使用 authors
      let response = await fetch(`${apiUrl}/authors-with-counts`)
      
      if (!response.ok) {
        // 備用方案：使用普通的 authors endpoint
        console.log('authors-with-counts 失敗，使用備用 API')
        response = await fetch(`${apiUrl}/authors`)
      }
      
      if (response.ok) {
        const data = await response.json()
        
        // 如果沒有 artwork_count，手動計算
        const authorsWithCounts = await Promise.all(
          data.map(async (author) => {
            if (author.artwork_count === undefined) {
              // 獲取該作者的作品數量
              try {
                const artworksRes = await fetch(`${apiUrl}/artworks`)
                if (artworksRes.ok) {
                  const artworks = await artworksRes.json()
                  const count = artworks.filter(artwork => 
                    artwork.authors && artwork.authors.includes(author.name)
                  ).length
                  return { ...author, artwork_count: count }
                }
              } catch (e) {
                console.error('計算作品數量失敗:', e)
              }
            }
            return author
          })
        )
        
        // 只顯示有作品的作者
        const authorsWithArtworks = authorsWithCounts.filter(
          author => author.artwork_count > 0
        )
        
        setAuthors(authorsWithArtworks)
        setFilteredAuthors(authorsWithArtworks)
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
        <div className="authors-loading">
          <Loading />
        </div>
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
            探索 {authors.length} 位藝術家的創作世界
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
          <div className="authors-grid-container">
            {/* 精選創作者 */}
            {groupedAuthors.featured.length > 0 && (
              <section className="author-section featured-section">
                <h2 className="section-title">精選創作者</h2>
                <div className="authors-grid featured-grid">
                  {groupedAuthors.featured.map(author => (
                    <Link
                      key={author.id || author.name}
                      to={`/author/${encodeURIComponent(author.name)}`}
                      className="author-card featured-card"
                    >
                      <div className="author-avatar">
                        {author.avatar_url ? (
                          <img src={author.avatar_url} alt={author.name} />
                        ) : (
                          <div className="avatar-placeholder">
                            {author.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <h3 className="author-name">{author.name}</h3>
                      <p className="author-count">{author.artwork_count} 件作品</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            
            {/* 活躍創作者 */}
            {groupedAuthors.active.length > 0 && (
              <section className="author-section">
                <h2 className="section-title">活躍創作者</h2>
                <div className="authors-grid">
                  {groupedAuthors.active.map(author => (
                    <Link
                      key={author.id || author.name}
                      to={`/author/${encodeURIComponent(author.name)}`}
                      className="author-card"
                    >
                      <div className="author-avatar small">
                        {author.avatar_url ? (
                          <img src={author.avatar_url} alt={author.name} />
                        ) : (
                          <div className="avatar-placeholder">
                            {author.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <h3 className="author-name">{author.name}</h3>
                      <p className="author-count">{author.artwork_count} 件作品</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            
            {/* 新進創作者 */}
            {groupedAuthors.emerging.length > 0 && (
              <section className="author-section">
                <h2 className="section-title">新進創作者</h2>
                <div className="authors-list">
                  {groupedAuthors.emerging.map(author => (
                    <Link
                      key={author.id || author.name}
                      to={`/author/${encodeURIComponent(author.name)}`}
                      className="author-list-item"
                    >
                      <span className="author-name">{author.name}</span>
                      <span className="author-count">({author.artwork_count})</span>
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