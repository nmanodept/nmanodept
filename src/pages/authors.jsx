//Location: /src/pages/authors.jsx
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
      }
    } catch (error) {
      console.error('Failed to fetch authors:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAuthors = authors.filter(author =>
    author.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 依作品數量分類
  const featuredAuthors = filteredAuthors.filter(a => a.artwork_count >= 5)
  const activeAuthors = filteredAuthors.filter(a => a.artwork_count >= 2 && a.artwork_count < 5)
  const allAuthors = filteredAuthors

  if (loading) return <Layout><Loading /></Layout>

  return (
    <Layout>
      <Seo title="作者" description="瀏覽所有創作者" />
      <div className="authors-container">
        <div className="authors-header">
          <h1>作者</h1>
          <p className="stats">共 {authors.length} 位創作者，{authors.reduce((sum, a) => sum + a.artwork_count, 0)} 件作品</p>
        </div>

        <div className="search-section">
          <input
            type="text"
            placeholder="搜尋作者..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {searchTerm === '' && featuredAuthors.length > 0 && (
          <section className="authors-section">
            <h2>特色創作者</h2>
            <div className="authors-grid featured">
              {featuredAuthors.map(author => (
                <Link 
                  key={author.id} 
                  to={`/author/${encodeURIComponent(author.name)}/`}
                  className="author-card featured"
                >
                  <div className="author-avatar">
                    {author.name.charAt(0)}
                  </div>
                  <h3>{author.name}</h3>
                  <p className="artwork-count">共 {author.artwork_count} 件作品</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {searchTerm === '' && activeAuthors.length > 0 && (
          <section className="authors-section">
            <h2>活躍創作者</h2>
            <div className="authors-grid">
              {activeAuthors.map(author => (
                <Link 
                  key={author.id} 
                  to={`/author/${encodeURIComponent(author.name)}/`}
                  className="author-card"
                >
                  <div className="author-avatar">
                    {author.name.charAt(0)}
                  </div>
                  <h3>{author.name}</h3>
                  <p className="artwork-count">共 {author.artwork_count} 件作品</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="authors-section">
          <h2>{searchTerm ? '搜尋結果' : '所有創作者'}</h2>
          <div className="authors-grid all">
            {allAuthors.map(author => (
              <Link 
                key={author.id} 
                to={`/author/${encodeURIComponent(author.name)}/`}
                className="author-card compact"
              >
                <span className="author-name">{author.name}</span>
                <span className="artwork-count">共 {author.artwork_count} 件作品</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  )
}

export default AuthorsPage