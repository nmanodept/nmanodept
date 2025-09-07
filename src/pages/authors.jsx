import React, { useState, useEffect } from 'react'
import { Link } from 'gatsby'
import Layout from '../components/common/Layout'
import Seo from '../components/common/Seo'
import Loading from '../components/common/Loading'
import './authors.css'

const AuthorsPage = () => {
  const [authors, setAuthors] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAuthors()
  }, [])

  const fetchAuthors = async () => {
    setLoading(true)
    setError('')
    
    try {
      const apiUrl = process.env.GATSBY_API_URL || 'https://artwork-submit-api.nmanodept.workers.dev'
      
      // 使用新的 endpoint 或舊的 endpoint
      let response = await fetch(`${apiUrl}/authors-with-counts`)
      
      // 如果新 endpoint 失敗，嘗試舊的
      if (!response.ok) {
        response = await fetch(`${apiUrl}/authors`)
      }
      
      if (response.ok) {
        const data = await response.json()
        // 確保資料是陣列
        const authorsArray = Array.isArray(data) ? data : []
        // 過濾出有作品的作者
        const activeAuthors = authorsArray.filter(author => 
          author.artwork_count > 0 || author.artworks_count > 0
        )
        setAuthors(activeAuthors)
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

  // 過濾作者
  const filteredAuthors = authors.filter(author =>
    author.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 按作品數量分組
  const groupAuthors = (authors) => {
    const sorted = [...authors].sort((a, b) => 
      (b.artwork_count || 0) - (a.artwork_count || 0)
    )
    
    return {
      featured: sorted.filter(a => (a.artwork_count || 0) >= 5),
      active: sorted.filter(a => (a.artwork_count || 0) >= 2 && (a.artwork_count || 0) < 5),
      emerging: sorted.filter(a => (a.artwork_count || 0) === 1)
    }
  }

  const groupedAuthors = groupAuthors(filteredAuthors)

  if (loading) {
    return (
      <Layout>
        <Seo title="作者" />
        <Loading />
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <Seo title="作者" />
        <div className="error-container">
          <h2>載入失敗</h2>
          <p>{error}</p>
          <button onClick={fetchAuthors} className="btn btn-primary">
            重試
          </button>
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
        <div className="authors-header">
          <h1 className="authors-title">作者</h1>
          <p className="authors-subtitle">
            共 {authors.length} 位創作者
          </p>
        </div>

        <div className="authors-search">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜尋作者..."
            className="search-input"
          />
        </div>

        {filteredAuthors.length === 0 ? (
          <div className="empty-state">
            <p>沒有找到符合條件的作者</p>
          </div>
        ) : (
          <div className="authors-sections">
            {/* 特色作者 */}
            {groupedAuthors.featured.length > 0 && (
              <section className="author-section">
                <h2 className="section-title">特色創作者</h2>
                <div className="featured-grid">
                  {groupedAuthors.featured.map(author => (
                    <Link
                      key={author.id}
                      to={`/author/${encodeURIComponent(author.name)}`}
                      className="author-card featured"
                    >
                      <div className="author-avatar">
                        {author.avatar_url ? (
                          <img src={author.avatar_url} alt={author.name} />
                        ) : (
                          <div className="avatar-placeholder">
                            <span>{author.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                      <h3 className="author-name">{author.name}</h3>
                      <p className="author-works">
                        {author.artwork_count || 0} 件作品
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* 其他作者區塊類似... */}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default AuthorsPage