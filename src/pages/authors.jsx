import React, { useState, useEffect } from 'react'
import { Link } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import './authors.css'

const AuthorsPage = () => {
  const [authors, setAuthors] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [authorProfiles, setAuthorProfiles] = useState({})

  useEffect(() => {
    fetchAuthors()
  }, [])

  const fetchAuthors = async () => {
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      const response = await fetch(`${apiUrl}/authors-with-counts`)
      
      if (response.ok) {
        const data = await response.json()
        setAuthors(data)
        
        // 獲取有個人資料的作者頭像
        const profiles = {}
        for (const author of data.filter(a => a.has_profile)) {
          try {
            const profileResponse = await fetch(`${apiUrl}/author/${encodeURIComponent(author.name)}`)
            if (profileResponse.ok) {
              const profileData = await profileResponse.json()
              profiles[author.name] = profileData.avatar_url
            }
          } catch (err) {
            console.error(`Failed to fetch profile for ${author.name}:`, err)
          }
        }
        setAuthorProfiles(profiles)
      }
    } catch (error) {
      console.error('Failed to fetch authors:', error)
    } finally {
      setLoading(false)
    }
  }

  // 過濾作者
  const filteredAuthors = authors.filter(author =>
    author.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 按作品數量分組
  const groupAuthors = (authors) => {
    const sorted = [...authors].sort((a, b) => b.artwork_count - a.artwork_count)
    const groups = {
      featured: sorted.filter(a => a.artwork_count >= 5),
      active: sorted.filter(a => a.artwork_count >= 2 && a.artwork_count < 5),
      emerging: sorted.filter(a => a.artwork_count === 1)
    }
    return groups
  }

  const groupedAuthors = groupAuthors(filteredAuthors)

  if (loading) {
    return (
      <Layout>
        <div className="authors-loading">
          <div className="loading-spinner"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Seo 
        title="作者" 
        description="探索平台上的所有創作者"
      />
      
      <div className="authors-container">
        {/* 頁面標題 */}
        <div className="authors-header">
          <h1 className="authors-title">作者</h1>
          <p className="authors-subtitle">
            共 {authors.length} 位創作者，{authors.reduce((sum, author) => sum + author.artwork_count, 0)} 件作品
          </p>
        </div>

        {/* 搜尋框 */}
        <div className="authors-search">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜尋作者..."
            className="search-input"
          />
          <svg className="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M9 17A8 8 0 109 1a8 8 0 000 16z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M15 15l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        {/* 作者列表 */}
        {filteredAuthors.length === 0 ? (
          <div className="empty-state">
            <p>沒有找到符合條件的作者</p>
          </div>
        ) : (
          <div className="authors-sections">
            {/* 特色作者 */}
            {groupedAuthors.featured.length > 0 && (
              <section className="author-section">
                <h2 className="section-title">
                  <span className="accent-bar"></span>
                  特色創作者
                </h2>
                <div className="featured-grid">
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
                          <div className="avatar-circle has-profile">
                            <span>{author.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                      <div className="author-info">
                        <h3 className="author-name">{author.name}</h3>
                        <p className="author-works">共 {author.artwork_count} 件作品</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* 活躍作者 */}
            {groupedAuthors.active.length > 0 && (
              <section className="author-section">
                <h2 className="section-title">
                  <span className="accent-bar"></span>
                  活躍創作者
                </h2>
                <div className="active-grid">
                  {groupedAuthors.active.map(author => (
                    <Link
                      key={author.id}
                      to={`/author/${encodeURIComponent(author.name)}`}
                      className="author-card active"
                    >
                      <div className="author-avatar-small">
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

            {/* 新進作者 */}
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